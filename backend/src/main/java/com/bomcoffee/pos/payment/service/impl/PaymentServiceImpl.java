package com.bomcoffee.pos.payment.service.impl;

import com.bomcoffee.pos.billiard.entity.BilliardSession;
import com.bomcoffee.pos.billiard.repository.BilliardSessionRepository;
import com.bomcoffee.pos.common.enums.BilliardSessionStatus;
import com.bomcoffee.pos.common.enums.OrderItemStatus;
import com.bomcoffee.pos.common.enums.OrderStatus;
import com.bomcoffee.pos.common.enums.TableStatus;
import com.bomcoffee.pos.common.exception.BusinessException;
import com.bomcoffee.pos.common.exception.ResourceNotFoundException;
import com.bomcoffee.pos.notification.NotificationService;
import com.bomcoffee.pos.notification.dto.TableStatusNotificationDTO;
import com.bomcoffee.pos.order.entity.Order;
import com.bomcoffee.pos.order.entity.OrderItem;
import com.bomcoffee.pos.order.repository.OrderRepository;
import com.bomcoffee.pos.payment.controller.PaymentController.CheckoutRequest;
import com.bomcoffee.pos.payment.controller.PaymentController.PaymentDetail;
import com.bomcoffee.pos.payment.entity.Payment;
import com.bomcoffee.pos.payment.repository.PaymentRepository;
import com.bomcoffee.pos.payment.service.PaymentService;
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
public class PaymentServiceImpl implements PaymentService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final TableRepository tableRepository;
    private final BilliardSessionRepository billiardSessionRepository;
    private final NotificationService notificationService;

    @Override
    public List<Payment> checkout(Long orderId, CheckoutRequest req, User cashier) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        // Validate order status
        if (order.getStatus() != OrderStatus.OPEN) {
            throw new BusinessException("Đơn hàng đã được thanh toán hoặc đã hủy", "ORDER_NOT_OPEN");
        }

        // Allow checkout anytime (some cafes require pay-upfront so items will be PENDING)
        // We only check if order is OPEN

        // Validate all billiard sessions are finished - REMOVED
        // We allow checking out drinks independently of billiard sessions

        // Apply discount and recalculate
        BigDecimal discount = req.getDiscountAmount() != null ? req.getDiscountAmount() : BigDecimal.ZERO;
        if (discount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Số tiền giảm giá không được âm", "INVALID_DISCOUNT");
        }
        order.setDiscountAmount(discount);
        order.recalculate();

        BigDecimal finalAmount = order.getFinalAmount();

        // Validate payments
        if (req.getPayments() == null || req.getPayments().isEmpty()) {
            throw new BusinessException("Phải có ít nhất 1 phương thức thanh toán", "NO_PAYMENT_METHOD");
        }

        BigDecimal totalPaid = req.getPayments().stream()
                .map(PaymentDetail::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalPaid.compareTo(finalAmount) != 0) {
            throw new BusinessException(
                String.format("Tổng tiền thanh toán (%.0f) phải bằng số tiền cần trả (%.0f)", 
                    totalPaid.doubleValue(), finalAmount.doubleValue()),
                "PAYMENT_AMOUNT_MISMATCH"
            );
        }

        // Create payment records
        List<Payment> payments = new ArrayList<>();
        LocalDateTime paidAt = LocalDateTime.now();
        
        for (PaymentDetail detail : req.getPayments()) {
            if (detail.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException("Số tiền thanh toán phải lớn hơn 0", "INVALID_PAYMENT_AMOUNT");
            }
            
            Payment payment = Payment.builder()
                    .order(order)
                    .method(detail.getMethod())
                    .amount(detail.getAmount())
                    .paidAt(paidAt)
                    .cashier(cashier)
                    .note(detail.getNote())
                    .build();
            payments.add(paymentRepository.save(payment));
        }

        // Mark order as completed
        order.setStatus(OrderStatus.COMPLETED);
        order.setClosedAt(paidAt);
        orderRepository.save(order);

        // Release table if no active billiard session
        if (order.getTable() != null) {
            boolean hasBilliardPlaying = billiardSessionRepository
                .findByTableIdAndStatus(order.getTable().getId(), BilliardSessionStatus.PLAYING)
                .isPresent();
            
            if (!hasBilliardPlaying) {
                order.getTable().setStatus(TableStatus.EMPTY);
                tableRepository.save(order.getTable());
                notificationService.broadcastTableStatusUpdate(
                    TableStatusNotificationDTO.builder()
                        .tableId(order.getTable().getId())
                        .status(TableStatus.EMPTY)
                        .build()
                );
            }
        }

        return payments;
    }
}
