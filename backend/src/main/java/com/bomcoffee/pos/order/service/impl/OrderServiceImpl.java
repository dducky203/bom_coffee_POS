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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
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
        Order order = loadOrderGraph(id);
        initializeOrder(order);
        return order;
    }

    @Override
    public Order getActiveOrderByTable(Long tableId) {
        Order order = getOpenOrderGraphByTable(tableId);
        initializeOrder(order);
        return order;
    }

    @Override
    public Order getRecentCompletedOrderByTable(Long tableId, int withinMinutes) {
        java.time.LocalDateTime since = java.time.LocalDateTime.now().minusMinutes(withinMinutes);
        List<Order> recentOrders = orderRepository.findRecentCompletedOrdersByTable(tableId, since);
        if (recentOrders.isEmpty()) {
            return null;
        }
        Order order = loadOrderGraph(recentOrders.get(0).getId());
        initializeOrder(order);
        return order;
    }

    @Override
    public Order createOrder(CreateOrderRequest req, User currentUser) {
        Order existing = getOpenOrderGraphByTable(req.getTableId());
        if (existing != null) {
            return existing;
        }
        return createNewOrder(req.getTableId(), req.getPreviousOrderId(), currentUser);
    }

    @Override
    public Order submitOrder(SubmitOrderRequest req, User currentUser) {
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new BusinessException("Chưa có món trong order", "EMPTY_ORDER");
        }
        Order order = getOpenOrderGraphByTable(req.getTableId());
        if (order == null) {
            order = createNewOrder(req.getTableId(), null, currentUser);
        }
        applyCustomerName(order, req.getCustomerName());
        addItemsToOrder(order, req.getItems(), currentUser);
        attachOrphanBilliardSessions(order);
        pruneStaleBilliardSessions(order);
        if (req.isPayNow()) {
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
        Order order = loadOrderGraph(orderId);
        List<OrderItem> saved = addItemsToOrder(order, List.of(req), currentUser);
        return saved.get(0);
    }

    private List<OrderItem> addItemsToOrder(Order order, List<AddItemRequest> reqs, User currentUser) {
        if (order.getStatus() != OrderStatus.OPEN) {
            throw new BusinessException("Đơn hàng đã đóng", "ORDER_CLOSED");
        }
        if (reqs == null || reqs.isEmpty()) {
            return List.of();
        }

        Set<Long> productIds = reqs.stream().map(AddItemRequest::getProductId).collect(Collectors.toSet());
        Map<Long, Product> products = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        Set<Long> toppingIds = reqs.stream()
                .map(AddItemRequest::getToppingIds)
                .filter(Objects::nonNull)
                .flatMap(List::stream)
                .collect(Collectors.toSet());
        Map<Long, Topping> toppingsById = toppingIds.isEmpty()
                ? Map.of()
                : toppingRepository.findAllById(toppingIds).stream()
                        .filter(Topping::isActive)
                        .collect(Collectors.toMap(Topping::getId, t -> t, (a, b) -> a));

        String updatedBy = currentUser != null ? currentUser.getUsername() : null;
        List<OrderItem> toSave = new ArrayList<>(reqs.size());
        for (AddItemRequest req : reqs) {
            toSave.add(buildOrderItem(order, req, products, toppingsById, updatedBy));
        }

        List<OrderItem> saved = orderItemRepository.saveAll(toSave);
        if (order.getItems() == null) {
            order.setItems(new ArrayList<>());
        }
        order.getItems().addAll(saved);
        if (order.getDiscountAmount() == null) {
            order.setDiscountAmount(BigDecimal.ZERO);
        }
        order.recalculate();
        orderRepository.save(order);

        for (OrderItem item : saved) {
            Product product = item.getProduct();
            notificationService.broadcastKdsUpdate(
                KdsNotificationDTO.builder()
                    .type("NEW_ITEM")
                    .orderId(order.getId())
                    .tableId(order.getTable().getId())
                    .tableName(order.getTable().getName())
                    .itemId(item.getId())
                    .productName(product.getName())
                    .quantity(item.getQuantity())
                    .note(item.getNote())
                    .build()
            );
        }
        return saved;
    }

    private OrderItem buildOrderItem(
            Order order,
            AddItemRequest req,
            Map<Long, Product> products,
            Map<Long, Topping> toppingsById,
            String updatedBy) {
        Product product = products.get(req.getProductId());
        if (product == null) {
            throw new ResourceNotFoundException("Product", req.getProductId());
        }

        int ice = normalizePercent(req.getIcePercent(), product.isHasDrinkOptions());
        int sugar = normalizePercent(req.getSugarPercent(), product.isHasDrinkOptions());

        List<Topping> toppings = List.of();
        if (req.getToppingIds() != null && !req.getToppingIds().isEmpty()) {
            toppings = req.getToppingIds().stream()
                    .map(toppingsById::get)
                    .filter(Objects::nonNull)
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
        item.setUpdatedBy(updatedBy);
        return item;
    }

    @Override
    public Order cancelItem(Long orderId, Long itemId, User currentUser) {
        Order order = loadOrderGraph(orderId);
        if (order.getStatus() != OrderStatus.OPEN) {
            throw new BusinessException("Chỉ hủy món trên đơn đang mở", "ORDER_CLOSED");
        }

        OrderItem item = order.getItems() == null ? null : order.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElse(null);
        if (item == null) {
            throw new ResourceNotFoundException("OrderItem", itemId);
        }
        if (item.getStatus() == OrderItemStatus.CANCELLED) {
            throw new BusinessException("Món này đã được hủy trước đó", "ITEM_ALREADY_CANCELLED");
        }

        item.setStatus(OrderItemStatus.CANCELLED);
        if (currentUser != null) {
            item.setUpdatedBy(currentUser.getUsername());
        }
        orderItemRepository.save(item);
        order.recalculate();
        orderRepository.save(order);

        Product product = item.getProduct();
        notificationService.broadcastKdsUpdate(
                KdsNotificationDTO.builder()
                        .type("STATUS_UPDATED")
                        .orderId(order.getId())
                        .tableId(order.getTable() != null ? order.getTable().getId() : null)
                        .tableName(order.getTable() != null ? order.getTable().getName() : null)
                        .itemId(item.getId())
                        .productName(product != null ? product.getName() : null)
                        .quantity(item.getQuantity())
                        .status(OrderItemStatus.CANCELLED)
                        .build()
        );

        return getOrderById(order.getId());
    }

    @Override
    public Order cancelOrder(Long orderId, User currentUser) {
        Order order = loadOrderGraph(orderId);
        if (order.getStatus() != OrderStatus.OPEN) {
            throw new BusinessException("Đơn hàng đã đóng hoặc đã hủy", "ORDER_NOT_OPEN");
        }

        String updatedBy = currentUser != null ? currentUser.getUsername() : null;
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                if (item.getStatus() == OrderItemStatus.CANCELLED) {
                    continue;
                }
                item.setStatus(OrderItemStatus.CANCELLED);
                item.setUpdatedBy(updatedBy);
                notificationService.broadcastKdsUpdate(
                        KdsNotificationDTO.builder()
                                .type("STATUS_UPDATED")
                                .orderId(order.getId())
                                .tableId(order.getTable() != null ? order.getTable().getId() : null)
                                .tableName(order.getTable() != null ? order.getTable().getName() : null)
                                .itemId(item.getId())
                                .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                                .quantity(item.getQuantity())
                                .status(OrderItemStatus.CANCELLED)
                                .build()
                );
            }
            orderItemRepository.saveAll(order.getItems());
        }

        voidBilliardSessionsOnCancel(order);

        order.setStatus(OrderStatus.CANCELLED);
        order.setClosedAt(java.time.LocalDateTime.now());
        order.setDiscountAmount(BigDecimal.ZERO);
        order.recalculate();
        orderRepository.save(order);

        if (order.getTable() != null) {
            RestaurantTable table = tableRepository.findById(order.getTable().getId())
                    .orElse(order.getTable());
            table.setStatus(TableStatus.EMPTY);
            tableRepository.save(table);
            notificationService.broadcastTableStatusUpdate(
                    TableStatusNotificationDTO.builder()
                            .tableId(table.getId())
                            .status(TableStatus.EMPTY)
                            .build()
            );
        }

        return getOrderById(order.getId());
    }

    /** Kết thúc phiên bi-a đang chơi và không tính tiền khi hủy đơn. */
    private void voidBilliardSessionsOnCancel(Order order) {
        if (order.getTable() == null) {
            return;
        }
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        List<BilliardSession> toSave = new ArrayList<>();

        if (order.getBilliardSessions() == null) {
            order.setBilliardSessions(new ArrayList<>());
        }

        for (BilliardSession session : order.getBilliardSessions()) {
            if (session.getStatus() == BilliardSessionStatus.PLAYING) {
                session.setStatus(BilliardSessionStatus.FINISHED);
                session.setEndTime(now);
            }
            session.setTotalAmount(BigDecimal.ZERO);
            toSave.add(session);
        }

        List<BilliardSession> playingOnTable = billiardSessionRepository.findAllByTableIdAndStatus(
                order.getTable().getId(), BilliardSessionStatus.PLAYING);
        for (BilliardSession session : playingOnTable) {
            if (session.getOrder() == null || order.getId().equals(session.getOrder().getId())) {
                session.setOrder(order);
                session.setStatus(BilliardSessionStatus.FINISHED);
                session.setEndTime(now);
                session.setTotalAmount(BigDecimal.ZERO);
                if (order.getBilliardSessions().stream().noneMatch(s -> s.getId().equals(session.getId()))) {
                    order.getBilliardSessions().add(session);
                }
                toSave.add(session);
            }
        }

        if (!toSave.isEmpty()) {
            billiardSessionRepository.saveAll(toSave);
        }
    }

    @Override
    public List<Order> getAllOpenOrders() {
        List<Order> orders = orderRepository.findByStatusWithItems(OrderStatus.OPEN);
        if (!orders.isEmpty()) {
            orderRepository.findWithBilliardSessionsByIdIn(
                    orders.stream().map(Order::getId).toList());
        }
        orders.forEach(this::initializeOrder);
        return orders;
    }

    private Order loadOrderGraph(Long id) {
        Order order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        orderRepository.findByIdWithBilliardSessions(id);
        return order;
    }

    private Order getOpenOrderGraphByTable(Long tableId) {
        Order order = orderRepository.findByTableIdAndStatusWithItems(tableId, OrderStatus.OPEN).orElse(null);
        if (order != null) {
            orderRepository.findByIdWithBilliardSessions(order.getId());
        }
        return order;
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
        int nextNo = (order.getBilliardSessions() == null ? 0 : order.getBilliardSessions().size()) + 1;
        if (order.getBilliardSessions() == null) {
            order.setBilliardSessions(new ArrayList<>());
        }
        for (BilliardSession session : orphans) {
            session.setOrder(order);
            session.setSessionNo(nextNo++);
            order.getBilliardSessions().add(session);
        }
        billiardSessionRepository.saveAll(orphans);
        order.recalculate();
        orderRepository.save(order);
    }

    private void pruneStaleBilliardSessions(Order order) {
        if (order == null || order.getStatus() != OrderStatus.OPEN
                || order.getBilliardSessions() == null || order.getCreatedAt() == null) {
            return;
        }
        java.time.LocalDateTime cutoff = order.getCreatedAt().minusMinutes(2);
        List<BilliardSession> stale = order.getBilliardSessions().stream()
                .filter(session -> session.getStatus() == BilliardSessionStatus.FINISHED)
                .filter(session -> session.getStartTime() != null && session.getStartTime().isBefore(cutoff))
                .toList();
        if (stale.isEmpty()) {
            return;
        }
        for (BilliardSession session : stale) {
            session.setOrder(null);
        }
        billiardSessionRepository.saveAll(stale);
        order.getBilliardSessions().removeAll(stale);
        order.recalculate();
        orderRepository.save(order);
    }
}
