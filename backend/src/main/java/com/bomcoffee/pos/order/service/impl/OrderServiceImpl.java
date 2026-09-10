package com.bomcoffee.pos.order.service.impl;

import com.bomcoffee.pos.common.enums.BilliardSessionStatus;
import com.bomcoffee.pos.common.enums.OrderItemStatus;
import com.bomcoffee.pos.common.enums.OrderStatus;
import com.bomcoffee.pos.common.enums.TableStatus;
import com.bomcoffee.pos.common.exception.BusinessException;
import com.bomcoffee.pos.common.exception.ResourceNotFoundException;
import com.bomcoffee.pos.notification.NotificationService;
import com.bomcoffee.pos.notification.dto.KdsNotificationDTO;
import com.bomcoffee.pos.notification.dto.TableStatusNotificationDTO;
import com.bomcoffee.pos.order.controller.OrderController.AddItemRequest;
import com.bomcoffee.pos.order.controller.OrderController.CreateOrderRequest;
import com.bomcoffee.pos.order.controller.OrderController.SubmitOrderRequest;
import com.bomcoffee.pos.billiard.entity.BilliardSession;
import com.bomcoffee.pos.billiard.repository.BilliardSessionRepository;
import com.bomcoffee.pos.payment.controller.PaymentController;
import com.bomcoffee.pos.payment.controller.PaymentController.CheckoutRequest;
import com.bomcoffee.pos.payment.service.PaymentService;
import com.bomcoffee.pos.order.entity.Order;
import com.bomcoffee.pos.order.entity.OrderItem;
import com.bomcoffee.pos.order.repository.OrderItemRepository;
import com.bomcoffee.pos.order.repository.OrderRepository;
import com.bomcoffee.pos.order.service.OrderService;
import com.bomcoffee.pos.product.entity.Product;
import com.bomcoffee.pos.product.entity.Topping;
import com.bomcoffee.pos.product.repository.ProductRepository;
import com.bomcoffee.pos.product.repository.ToppingRepository;
import com.bomcoffee.pos.table.entity.RestaurantTable;
import com.bomcoffee.pos.table.repository.TableRepository;
import com.bomcoffee.pos.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final TableRepository tableRepository;
    private final ProductRepository productRepository;
    private final ToppingRepository toppingRepository;
    private final NotificationService notificationService;
    private final PaymentService paymentService;
    private final BilliardSessionRepository billiardSessionRepository;

    @Override
    public Order getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        initializeOrder(order);
        return order;
    }

    @Override
    public Order getActiveOrderByTable(Long tableId) {
        Order order = orderRepository.findByTableIdAndStatus(tableId, OrderStatus.OPEN).orElse(null);
        initializeOrder(order);
        return order;
    }

    @Override
    public Order getRecentCompletedOrderByTable(Long tableId, int withinMinutes) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(withinMinutes);
        List<Order> recentOrders = orderRepository.findRecentCompletedOrdersByTable(tableId, since);
        if (recentOrders.isEmpty()) {
            return null;
        }
        Order order = recentOrders.get(0);
        initializeOrder(order);
        return order;
    }

    @Override
    public Order createOrder(CreateOrderRequest req, User currentUser) {
        return orderRepository.findByTableIdAndStatus(req.getTableId(), OrderStatus.OPEN)
                .orElseGet(() -> createNewOrder(req.getTableId(), req.getPreviousOrderId(), currentUser));
    }

    @Override
    public Order submitOrder(SubmitOrderRequest req, User currentUser) {
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new BusinessException("Chưa có món trong order", "EMPTY_ORDER");
        }
        Order order = orderRepository.findByTableIdAndStatus(req.getTableId(), OrderStatus.OPEN)
                .orElseGet(() -> createNewOrder(req.getTableId(), null, currentUser));
        applyCustomerName(order, req.getCustomerName());
        orderRepository.save(order);
        for (AddItemRequest item : req.getItems()) {
            addItemToOrder(order.getId(), item, currentUser);
        }
        attachOrphanBilliardSessions(order);
        pruneStaleBilliardSessions(order);
        if (req.isPayNow()) {
            // For immediate payment during submit, create a single payment detail
            CheckoutRequest checkout = new CheckoutRequest();
            checkout.setDiscountAmount(BigDecimal.ZERO);
            checkout.setCustomerName(req.getCustomerName());
            List<PaymentController.PaymentDetail> payments = new ArrayList<>();
            PaymentController.PaymentDetail detail = new PaymentController.PaymentDetail();
            detail.setMethod(req.getMethod());
            detail.setAmount(order.getFinalAmount());
            payments.add(detail);
            checkout.setPayments(payments);
            paymentService.checkout(order.getId(), checkout, currentUser);
        }
        return getOrderById(order.getId());
    }

    private Order createNewOrder(Long tableId, Long previousOrderId, User currentUser) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Table", tableId));

        // Validate previousOrderId if provided
        Order previousOrder = null;
        if (previousOrderId != null) {
            previousOrder = orderRepository.findById(previousOrderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Previous Order", previousOrderId));
            if (previousOrder.getStatus() != OrderStatus.COMPLETED && previousOrder.getStatus() != OrderStatus.PAID) {
                throw new BusinessException("Đơn trước phải đã hoàn thành", "PREVIOUS_ORDER_NOT_COMPLETED");
            }
        }

        Order order = new Order();
        order.setTable(table);
        order.setStaff(currentUser);
        order.setPreviousOrder(previousOrder);
        order.setStatus(OrderStatus.OPEN);
        order.setTotalAmount(BigDecimal.ZERO);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setFinalAmount(BigDecimal.ZERO);
        Order saved = orderRepository.save(order);

        table.setStatus(TableStatus.SERVING);
        tableRepository.save(table);
        notificationService.broadcastTableStatusUpdate(
            TableStatusNotificationDTO.builder()
                .tableId(table.getId())
                .status(TableStatus.SERVING)
                .build()
        );
        attachOrphanBilliardSessions(saved);
        pruneStaleBilliardSessions(saved);
        return saved;
    }

    private void applyCustomerName(Order order, String customerName) {
        if (order == null || customerName == null) {
            return;
        }
        String trimmed = customerName.trim();
        if (trimmed.isEmpty()) {
            return;
        }
        order.setCustomerName(trimmed.length() > 100 ? trimmed.substring(0, 100) : trimmed);
    }

    @Override
    public OrderItem addItemToOrder(Long orderId, AddItemRequest req, User currentUser) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        if (order.getStatus() != OrderStatus.OPEN) {
            throw new BusinessException("Đơn hàng đã đóng", "ORDER_CLOSED");
        }

        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", req.getProductId()));

        int ice = normalizePercent(req.getIcePercent(), product.isHasDrinkOptions());
        int sugar = normalizePercent(req.getSugarPercent(), product.isHasDrinkOptions());

        List<Topping> toppings = new ArrayList<>();
        if (req.getToppingIds() != null && !req.getToppingIds().isEmpty()) {
            toppings = toppingRepository.findAllById(req.getToppingIds()).stream()
                    .filter(Topping::isActive)
                    .toList();
        }

        BigDecimal extra = toppings.stream()
                .map(t -> t.getExtraPrice() != null ? t.getExtraPrice() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        String note = buildItemNote(product.isHasDrinkOptions(), ice, sugar, toppings, req.getNote());
        BigDecimal basePrice = product.getBasePrice() != null ? product.getBasePrice() : BigDecimal.ZERO;

        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProduct(product);
        item.setQuantity(req.getQuantity() != null ? req.getQuantity() : 1);
        item.setUnitPrice(basePrice.add(extra));
        item.setNote(note);
        item.setIcePercent(product.isHasDrinkOptions() ? ice : null);
        item.setSugarPercent(product.isHasDrinkOptions() ? sugar : null);
        item.setStatus(OrderItemStatus.PENDING);
        item.setUpdatedBy(currentUser != null ? currentUser.getUsername() : null);
        OrderItem saved = orderItemRepository.save(item);

        if (order.getItems() == null) {
            order.setItems(new ArrayList<>());
        }
        order.getItems().add(saved);
        if (order.getDiscountAmount() == null) {
            order.setDiscountAmount(BigDecimal.ZERO);
        }
        order.recalculate();
        orderRepository.save(order);

        notificationService.broadcastKdsUpdate(
            KdsNotificationDTO.builder()
                .type("NEW_ITEM")
                .orderId(order.getId())
                .tableId(order.getTable().getId())
                .tableName(order.getTable().getName())
                .itemId(saved.getId())
                .productName(product.getName())
                .quantity(req.getQuantity())
                .note(note)
                .build()
        );

        return saved;
    }

    @Override
    public void removeItemFromOrder(Long orderId, Long itemId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderItem", itemId));

        order.getItems().remove(item);
        orderItemRepository.delete(item);
        order.recalculate();
        orderRepository.save(order);
    }

    @Override
    public List<Order> getAllOpenOrders() {
        List<Order> orders = orderRepository.findByStatus(OrderStatus.OPEN);
        orders.forEach(this::initializeOrder);
        return orders;
    }

    private int normalizePercent(Integer value, boolean drinkOptions) {
        if (!drinkOptions) {
            return 100;
        }
        int percent = value != null ? value : 100;
        if (percent < 0 || percent > 100) {
            throw new BusinessException("Phần trăm đá/đường phải từ 0 đến 100", "INVALID_PERCENT");
        }
        return percent;
    }

    private String buildItemNote(boolean drinkOptions, int ice, int sugar, List<Topping> toppings, String extraNote) {
        List<String> parts = new ArrayList<>();
        if (drinkOptions) {
            parts.add("Đá " + ice + "%");
            parts.add("Đường " + sugar + "%");
        }
        if (!toppings.isEmpty()) {
            parts.add("Topping: " + toppings.stream().map(Topping::getName).collect(Collectors.joining(", ")));
        }
        if (extraNote != null && !extraNote.isBlank()) {
            parts.add(extraNote.trim());
        }
        return parts.isEmpty() ? null : String.join(" | ", parts);
    }

    private void initializeOrder(Order order) {
        if (order == null) {
            return;
        }
        if (order.getTable() != null) {
            order.getTable().getName();
        }
        if (order.getStaff() != null) {
            order.getStaff().getFullName();
        }
        order.getItems().forEach(item -> {
            if (item.getProduct() != null) {
                item.getProduct().getName();
            }
        });
        if (order.getBilliardSessions() != null) {
            order.getBilliardSessions().size();
        }
        pruneStaleBilliardSessions(order);
    }

    private void attachOrphanBilliardSessions(Order order) {
        if (order.getTable() == null) {
            return;
        }
        List<BilliardSession> orphans = billiardSessionRepository.findByTableIdAndOrderIsNullAndStatus(
                order.getTable().getId(), BilliardSessionStatus.PLAYING);
        if (orphans.isEmpty()) {
            return;
        }
        int nextNo = billiardSessionRepository.findByOrderIdOrderBySessionNoAsc(order.getId()).size() + 1;
        for (BilliardSession session : orphans) {
            session.setOrder(order);
            session.setSessionNo(nextNo++);
            billiardSessionRepository.save(session);
        }
        order.recalculate();
        orderRepository.save(order);
    }

    private void pruneStaleBilliardSessions(Order order) {
        if (order == null || order.getStatus() != OrderStatus.OPEN
                || order.getBilliardSessions() == null || order.getCreatedAt() == null) {
            return;
        }
        LocalDateTime cutoff = order.getCreatedAt().minusMinutes(2);
        List<BilliardSession> stale = order.getBilliardSessions().stream()
                .filter(session -> session.getStatus() == BilliardSessionStatus.FINISHED)
                .filter(session -> session.getStartTime() != null && session.getStartTime().isBefore(cutoff))
                .toList();
        if (stale.isEmpty()) {
            return;
        }
        for (BilliardSession session : stale) {
            session.setOrder(null);
            billiardSessionRepository.save(session);
            order.getBilliardSessions().remove(session);
        }
        order.recalculate();
        orderRepository.save(order);
    }
}
