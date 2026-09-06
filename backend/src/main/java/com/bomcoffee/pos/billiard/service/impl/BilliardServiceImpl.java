package com.bomcoffee.pos.billiard.service.impl;

import com.bomcoffee.pos.billiard.entity.BilliardPricing;
import com.bomcoffee.pos.billiard.entity.BilliardSession;
import com.bomcoffee.pos.billiard.repository.BilliardPricingRepository;
import com.bomcoffee.pos.billiard.repository.BilliardSessionRepository;
import com.bomcoffee.pos.billiard.service.BilliardService;
import com.bomcoffee.pos.common.enums.BilliardSessionStatus;
import com.bomcoffee.pos.common.enums.DayType;
import com.bomcoffee.pos.common.enums.OrderStatus;
import com.bomcoffee.pos.common.enums.TableStatus;
import com.bomcoffee.pos.common.exception.BusinessException;
import com.bomcoffee.pos.common.exception.ResourceNotFoundException;
import com.bomcoffee.pos.notification.NotificationService;
import com.bomcoffee.pos.notification.dto.TableStatusNotificationDTO;
import com.bomcoffee.pos.order.entity.Order;
import com.bomcoffee.pos.order.repository.OrderRepository;
import com.bomcoffee.pos.table.entity.RestaurantTable;
import com.bomcoffee.pos.table.repository.TableRepository;
import com.bomcoffee.pos.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class BilliardServiceImpl implements BilliardService {

    private final BilliardSessionRepository sessionRepository;
    private final BilliardPricingRepository pricingRepository;
    private final TableRepository tableRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    @Override
    public BilliardSession startSession(Long tableId, User currentUser) {
        sessionRepository.findByTableIdAndStatus(tableId, BilliardSessionStatus.PLAYING)
                .ifPresent(s -> { throw new BusinessException("Bàn này đang có phiên chơi", "SESSION_ALREADY_ACTIVE"); });

        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Table", tableId));

        Order order = orderRepository.findByTableIdAndStatus(tableId, OrderStatus.OPEN)
                .orElseGet(() -> createOpenOrder(table, currentUser));

        int sessionNo = sessionRepository.findByOrderIdOrderBySessionNoAsc(order.getId()).size() + 1;

        BilliardSession session = new BilliardSession();
        session.setTable(table);
        session.setOrder(order);
        session.setSessionNo(sessionNo);
        session.setStartTime(LocalDateTime.now());
        session.setStatus(BilliardSessionStatus.PLAYING);
        session.setTotalAmount(BigDecimal.ZERO);
        BilliardSession saved = sessionRepository.save(session);

        table.setStatus(TableStatus.SERVING);
        tableRepository.save(table);
        notificationService.broadcastTableStatusUpdate(
            TableStatusNotificationDTO.builder()
                .tableId(tableId)
                .status(TableStatus.SERVING)
                .build()
        );

        return saved;
    }

    @Override
    public BilliardSession stopSession(Long tableId) {
        BilliardSession session = sessionRepository.findByTableIdAndStatus(tableId, BilliardSessionStatus.PLAYING)
                .orElseThrow(() -> new BusinessException("Không tìm thấy phiên chơi đang hoạt động", "NO_ACTIVE_SESSION"));

        LocalDateTime endTime = LocalDateTime.now();
        session.setEndTime(endTime);
        session.setStatus(BilliardSessionStatus.FINISHED);
        session.setTotalAmount(calculateAmount(tableId, session.getStartTime(), endTime));

        Order order = session.getOrder();
        if (order == null) {
            order = orderRepository.findByTableIdAndStatus(tableId, OrderStatus.OPEN).orElse(null);
            if (order != null) {
                session.setOrder(order);
            }
        }
        BilliardSession saved = sessionRepository.save(session);

        if (order != null && order.getStatus() == OrderStatus.OPEN) {
            if (order.getBilliardSessions() == null || order.getBilliardSessions().stream().noneMatch(s -> s.getId().equals(saved.getId()))) {
                if (order.getBilliardSessions() == null) {
                    order.setBilliardSessions(new java.util.ArrayList<>());
                }
                order.getBilliardSessions().add(saved);
            }
            order.recalculate();
            orderRepository.save(order);
        }

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getCurrentSession(Long tableId) {
        return sessionRepository.findByTableIdAndStatus(tableId, BilliardSessionStatus.PLAYING)
                .map(session -> {
                    long elapsedSeconds = Duration.between(session.getStartTime(), LocalDateTime.now()).getSeconds();
                    BigDecimal currentAmount = calculateAmount(tableId, session.getStartTime(), LocalDateTime.now());
                    Map<String, Object> data = new HashMap<>();
                    data.put("sessionId", session.getId());
                    data.put("orderId", session.getOrder() != null ? session.getOrder().getId() : null);
                    data.put("sessionNo", session.getSessionNo());
                    data.put("startTime", session.getStartTime());
                    data.put("elapsedSeconds", elapsedSeconds);
                    data.put("currentAmount", currentAmount);
                    data.put("status", session.getStatus().name());
                    return data;
                })
                .orElse(null);
    }

    private Order createOpenOrder(RestaurantTable table, User currentUser) {
        Order order = new Order();
        order.setTable(table);
        order.setStaff(currentUser);
        order.setStatus(OrderStatus.OPEN);
        order.setTotalAmount(BigDecimal.ZERO);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setFinalAmount(BigDecimal.ZERO);
        return orderRepository.save(order);
    }

    private BigDecimal calculateAmount(Long tableId, LocalDateTime start, LocalDateTime end) {
        DayOfWeek dow = start.getDayOfWeek();
        DayType dayType = (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) ? DayType.WEEKEND : DayType.WEEKDAY;

        BigDecimal pricePerHour = pricingRepository
                .findApplicable(tableId, dayType, LocalTime.from(start))
                .map(BilliardPricing::getPricePerHour)
                .orElse(BigDecimal.valueOf(80000));

        long minutes = Math.max(Duration.between(start, end).toMinutes(), 0);
        return pricePerHour.multiply(BigDecimal.valueOf(minutes)).divide(BigDecimal.valueOf(60), 2, java.math.RoundingMode.HALF_UP);
    }
}
