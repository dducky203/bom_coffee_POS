package com.bomcoffee.pos.notification.dto;

import com.bomcoffee.pos.common.enums.OrderItemStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TableOrderNotificationDTO {
    private Long itemId;
    private OrderItemStatus status;
}
