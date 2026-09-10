package com.bomcoffee.pos.payment.service.impl;

import com.bomcoffee.pos.billiard.entity.BilliardSession;
import com.bomcoffee.pos.billiard.repository.BilliardSessionRepository;
import com.bomcoffee.pos.billiard.service.BilliardService;
import com.bomcoffee.pos.common.enums.BilliardSessionStatus;
import com.bomcoffee.pos.common.enums.OrderStatus;
import com.bomcoffee.pos.common.enums.TableStatus;
import com.bomcoffee.pos.common.exception.BusinessException;
import com.bomcoffee.pos.common.exception.ResourceNotFoundException;
import com.bomcoffee.pos.notification.NotificationService;
import com.bomcoffee.pos.notification.dto.TableStatusNotificationDTO;
import com.bomcoffee.pos.order.entity.Order;
import com.bomcoffee.pos.order.repository.OrderRepository;
import com.bomcoffee.pos.payment.controller.PaymentController.CheckoutRequest;
import com.bomcoffee.pos.payment.controller.PaymentController.PaymentDetail;
import com.bomcoffee.pos.payment.entity.Payment;
import com.bomcoffee.pos.payment.repository.PaymentRepository;
import com.bomcoffee.pos.payment.service.PaymentService;
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

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final TableRepository tableRepository;
    private final BilliardSessionRepository billiardSessionRepository;
    private final BilliardService billiardService;
    private final NotificationService notificationService;

    @Override
    public List<Payment> checkout(Long orderId, CheckoutRequest req, User cashier) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        if (order.getStatus() != OrderStatus.OPEN) {
            throw new BusinessException("Đơn hàng đã được thanh toán hoặc đã hủy", "ORDER_NOT_OPEN");
        }

        if (req.getCustomerName() != null && !req.getCustomerName().isBlank()) {
            String trimmed = req.getCustomerName().trim();
            order.setCustomerName(trimmed.length() > 100 ? trimmed.substring(0, 100) : trimmed);
        }

        finishPlayingBilliard(order);
        order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        if (order.getItems() != null) {
            order.getItems().size();
        }
        if (order.getBilliardSessions() != null) {
            order.getBilliardSessions().size();
        }

        BigDecimal discount = req.getDiscountAmount() != null ? req.getDiscountAmount() : BigDecimal.ZERO;
        if (discount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Số tiền giảm giá không được âm", "INVALID_DISCOUNT");
        }
        order.setDiscountAmount(discount);
        order.recalculate();

        BigDecimal finalAmount = order.getFinalAmount() != null ? order.getFinalAmount() : BigDecimal.ZERO;

        if (req.getPayments() == null || req.getPayments().isEmpty()) {
            throw new BusinessException("Phải có ít nhất 1 phương thức thanh toán", "NO_PAYMENT_METHOD");
        }

        if (req.getPayments().size() == 1 && finalAmount.compareTo(BigDecimal.ZERO) > 0) {
            req.getPayments().get(0).setAmount(finalAmount);
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

        List<Payment> payments = new ArrayList<>();
        LocalDateTime paidAt = LocalDateTime.now();

        for (PaymentDetail detail : req.getPayments()) {
            if (finalAmount.compareTo(BigDecimal.ZERO) > 0 && detail.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
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

        order.setStatus(OrderStatus.COMPLETED);
        order.setClosedAt(paidAt);
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

        return payments;
    }

    private void finishPlayingBilliard(Order order) {
        if (order.getTable() == null) {
            return;
        }
        Long tableId = order.getTable().getId();
        List<BilliardSession> playing = billiardSessionRepository
                .findAllByTableIdAndStatus(tableId, BilliardSessionStatus.PLAYING);
        for (BilliardSession session : playing) {
            if (session.getOrder() == null || !order.getId().equals(session.getOrder().getId())) {
                session.setOrder(order);
                billiardSessionRepository.save(session);
            }
            billiardService.stopSession(tableId, session.getId());
        }
    }
}
