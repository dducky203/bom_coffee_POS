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
import com.bomcoffee.pos.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class KdsServiceImpl implements KdsService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final OrderItemRepository orderItemRepository;
    private final NotificationService notificationService;

    @Override
    public List<OrderItem> getQueue(boolean all, User currentUser) {
        boolean isAdmin = currentUser != null
                && currentUser.getRole() != null
                && "ADMIN".equalsIgnoreCase(currentUser.getRole().getName());
        LocalDateTime startOfToday = LocalDate.now(VN_ZONE).atStartOfDay();

        List<OrderItem> items;
        if (all && isAdmin) {
            items = orderItemRepository.findByStatusIn(
                    List.of(OrderItemStatus.PENDING, OrderItemStatus.IN_PROGRESS, OrderItemStatus.DONE));
        } else {
            items = new ArrayList<>(orderItemRepository.findByStatusInAndCreatedAtGreaterThanEqual(
                    List.of(OrderItemStatus.PENDING, OrderItemStatus.IN_PROGRESS, OrderItemStatus.DONE),
                    startOfToday));
            items.addAll(orderItemRepository.findByStatusInAndCreatedAtLessThan(
                    List.of(OrderItemStatus.PENDING, OrderItemStatus.IN_PROGRESS),
                    startOfToday));
        }
        hydrate(items);
        return items;
    }

    private void hydrate(List<OrderItem> items) {
        items.forEach(item -> {
            if (item.getOrder() != null && item.getOrder().getTable() != null) {
                item.getOrder().getTable().getName();
            }
            if (item.getProduct() != null) {
                item.getProduct().getName();
            }
        });
    }

    @Override
    public OrderItem updateStatus(Long itemId, Map<String, String> body) {
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderItem", itemId));

        OrderItemStatus newStatus = OrderItemStatus.valueOf(body.get("status"));
        OrderItemStatus currentStatus = item.getStatus();

        boolean valid = (currentStatus == OrderItemStatus.PENDING && newStatus == OrderItemStatus.IN_PROGRESS)
                || (currentStatus == OrderItemStatus.IN_PROGRESS && newStatus == OrderItemStatus.DONE)
                || (currentStatus == OrderItemStatus.DONE && newStatus == OrderItemStatus.SERVED);
        if (!valid) {
            throw new BusinessException("Trạng thái không hợp lệ: " + currentStatus + " → " + newStatus, "INVALID_STATUS_TRANSITION");
        }

        item.setStatus(newStatus);
        OrderItem saved = orderItemRepository.save(item);

        notificationService.broadcastKdsUpdate(
            KdsNotificationDTO.builder()
                .type("STATUS_UPDATED")
                .itemId(itemId)
                .status(newStatus)
                .build()
        );
        notificationService.broadcastTableUpdate(
                saved.getOrder().getTable().getId(),
                TableOrderNotificationDTO.builder()
                    .itemId(itemId)
                    .status(newStatus)
                    .build()
        );

        return saved;
    }
}
