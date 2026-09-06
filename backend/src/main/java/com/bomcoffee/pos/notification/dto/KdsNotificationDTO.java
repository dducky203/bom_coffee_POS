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
public class KdsNotificationDTO {
    private String type; // "NEW_ITEM", "STATUS_UPDATED"
    
    // For NEW_ITEM
    private Long orderId;
    private Long tableId;
    private String tableName;
    private Long itemId;
    private String productName;
    private Integer quantity;
    private String note;
    
    // For STATUS_UPDATED
    private OrderItemStatus status;
}
