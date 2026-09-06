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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class KdsServiceImpl implements KdsService {

    private final OrderItemRepository orderItemRepository;
    private final NotificationService notificationService;

    @Override
    public List<OrderItem> getQueue() {
        List<OrderItem> items = orderItemRepository.findByStatusIn(
                List.of(OrderItemStatus.PENDING, OrderItemStatus.IN_PROGRESS, OrderItemStatus.DONE));
        items.forEach(item -> {
            if (item.getOrder() != null && item.getOrder().getTable() != null) {
                item.getOrder().getTable().getName();
            }
            if (item.getProduct() != null) {
                item.getProduct().getName();
            }
        });
        return items;
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
