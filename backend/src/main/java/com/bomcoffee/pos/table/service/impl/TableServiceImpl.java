package com.bomcoffee.pos.table.service.impl;

import com.bomcoffee.pos.common.enums.TableStatus;
import com.bomcoffee.pos.common.exception.ResourceNotFoundException;
import com.bomcoffee.pos.notification.NotificationService;
import com.bomcoffee.pos.notification.dto.TableStatusNotificationDTO;
import com.bomcoffee.pos.table.entity.RestaurantTable;
import com.bomcoffee.pos.table.repository.TableRepository;
import com.bomcoffee.pos.table.service.TableService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class TableServiceImpl implements TableService {

    private final TableRepository tableRepository;
    private final NotificationService notificationService;

    @Override
    public List<RestaurantTable> getAllTables() {
        return tableRepository.findAll();
    }

    @Override
    public RestaurantTable getTableById(Long id) {
        return tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table", id));
    }

    @Override
    public RestaurantTable updateTableStatus(Long id, Map<String, String> body) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table", id));
        TableStatus newStatus = TableStatus.valueOf(body.get("status"));
        table.setStatus(newStatus);
        tableRepository.save(table);
        notificationService.broadcastTableStatusUpdate(
            TableStatusNotificationDTO.builder()
                .tableId(id)
                .status(newStatus)
                .build()
        );
        return table;
    }
}
