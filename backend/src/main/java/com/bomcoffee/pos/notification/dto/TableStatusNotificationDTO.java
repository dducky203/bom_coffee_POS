package com.bomcoffee.pos.notification.dto;

import com.bomcoffee.pos.common.enums.TableStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TableStatusNotificationDTO {
    private Long tableId;
    private TableStatus status;
}
