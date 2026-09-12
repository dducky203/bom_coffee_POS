package com.bomcoffee.pos.kds.service.impl;

import com.bomcoffee.pos.common.enums.OrderItemStatus;
import com.bomcoffee.pos.common.exception.BusinessException;
import com.bomcoffee.pos.common.exception.ResourceNotFoundException;
import com.bomcoffee.pos.kds.service.KdsService;
import com.bomcoffee.pos.notification.NotificationService;
import com.bomcoffee.pos.notification.dto.KdsNotificationDTO;
import com.bomcoffee.pos.notification.dto.TableOrderNotificationDTO;
import com.bomcoffee.pos.order.entity.OrderItem;
import com.bomcoffee.pos.order.repository.OrderItemRepository;
import com.bomcoffee.pos.order.repository.OrderRepository;
import com.bomcoffee.pos.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class KdsServiceImpl implements KdsService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final List<OrderItemStatus> TODAY_STATUSES =
            List.of(OrderItemStatus.PENDING, OrderItemStatus.IN_PROGRESS, OrderItemStatus.DONE);
    private static final List<OrderItemStatus> CARRY_STATUSES =
            List.of(OrderItemStatus.PENDING, OrderItemStatus.IN_PROGRESS);

    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public List<OrderItem> getQueue(boolean all, User currentUser) {
        boolean isAdmin = currentUser != null
                && currentUser.getRole() != null
                && "ADMIN".equalsIgnoreCase(currentUser.getRole().getName());
        LocalDateTime startOfToday = LocalDate.now(VN_ZONE).atStartOfDay();

        if (all && isAdmin) {
            return orderItemRepository.findByStatusInWithRelations(TODAY_STATUSES);
        }
        return orderItemRepository.findQueueWithRelations(TODAY_STATUSES, CARRY_STATUSES, startOfToday);
    }

    @Override
    public OrderItem updateStatus(Long itemId, Map<String, String> body) {
        List<OrderItem> saved = updateStatuses(List.of(itemId), body != null ? body.get("status") : null);
        return saved.get(0);
    }

    @Override
    public List<OrderItem> updateStatuses(List<Long> itemIds, String status) {
        if (itemIds == null || itemIds.isEmpty()) {
            throw new BusinessException("Danh sách món trống", "EMPTY_ITEM_IDS");
        }
        if (status == null || status.isBlank()) {
            throw new BusinessException("Thiếu trạng thái", "MISSING_STATUS");
        }

        OrderItemStatus newStatus;
        try {
            newStatus = OrderItemStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Trạng thái không hợp lệ: " + status, "INVALID_STATUS");
        }

        List<Long> distinctIds = itemIds.stream().filter(id -> id != null).distinct().toList();
        if (distinctIds.isEmpty()) {
            throw new BusinessException("Danh sách món trống", "EMPTY_ITEM_IDS");
        }

        List<OrderItem> loaded = orderItemRepository.findByIdIn(distinctIds);
        Map<Long, OrderItem> byId = loaded.stream()
                .collect(Collectors.toMap(OrderItem::getId, item -> item, (a, b) -> a));
        if (byId.size() != distinctIds.size()) {
            Long missingId = distinctIds.stream()
                    .filter(id -> !byId.containsKey(id))
                    .findFirst()
                    .orElse(distinctIds.get(0));
            throw new ResourceNotFoundException("OrderItem", missingId);
        }

        List<OrderItem> items = distinctIds.stream().map(byId::get).toList();
        for (OrderItem item : items) {
            if (!isValidTransition(item.getStatus(), newStatus)) {
                throw new BusinessException(
                        "Trạng thái không hợp lệ: " + item.getStatus() + " → " + newStatus,
                        "INVALID_STATUS_TRANSITION");
            }
            item.setStatus(newStatus);
        }

        List<OrderItem> saved = orderItemRepository.saveAll(items);

        // Hủy món từ KDS → trừ tiền khỏi hóa đơn
        if (newStatus == OrderItemStatus.CANCELLED) {
            Set<Long> orderIds = saved.stream()
                    .map(i -> i.getOrder() != null ? i.getOrder().getId() : null)
                    .filter(id -> id != null)
                    .collect(Collectors.toSet());
            for (Long orderId : orderIds) {
                orderRepository.findByIdWithItems(orderId).ifPresent(order -> {
                    orderRepository.findByIdWithBilliardSessions(orderId);
                    order.recalculate();
                    orderRepository.save(order);
                });
            }
        }

        notifyStatusUpdated(saved, newStatus);
        return saved;
    }

    private boolean isValidTransition(OrderItemStatus current, OrderItemStatus next) {
        if (current == OrderItemStatus.CANCELLED) {
            return false;
        }
        // Hủy món (hết hàng / khách đổi) từ mọi trạng thái chưa hủy
        if (next == OrderItemStatus.CANCELLED) {
            return current == OrderItemStatus.PENDING
                    || current == OrderItemStatus.IN_PROGRESS
                    || current == OrderItemStatus.DONE
                    || current == OrderItemStatus.SERVED;
        }
        return (current == OrderItemStatus.PENDING && next == OrderItemStatus.IN_PROGRESS)
                || (current == OrderItemStatus.PENDING && next == OrderItemStatus.DONE)
                || (current == OrderItemStatus.IN_PROGRESS && next == OrderItemStatus.DONE)
                || (current == OrderItemStatus.DONE && next == OrderItemStatus.SERVED);
    }

    private void notifyStatusUpdated(List<OrderItem> items, OrderItemStatus newStatus) {
        for (OrderItem item : items) {
            notificationService.broadcastKdsUpdate(
                    KdsNotificationDTO.builder()
                            .type("STATUS_UPDATED")
                            .itemId(item.getId())
                            .status(newStatus)
                            .build()
            );
            if (item.getOrder() != null && item.getOrder().getTable() != null) {
                notificationService.broadcastTableUpdate(
                        item.getOrder().getTable().getId(),
                        TableOrderNotificationDTO.builder()
                                .itemId(item.getId())
                                .status(newStatus)
                                .build()
                );
            }
        }
    }
}
