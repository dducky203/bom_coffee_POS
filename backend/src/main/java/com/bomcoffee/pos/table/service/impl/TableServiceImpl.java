package com.bomcoffee.pos.table.service.impl;

import com.bomcoffee.pos.common.enums.TableStatus;
import com.bomcoffee.pos.common.enums.TableType;
import com.bomcoffee.pos.common.exception.BusinessException;
import com.bomcoffee.pos.common.exception.ResourceNotFoundException;
import com.bomcoffee.pos.notification.NotificationService;
import com.bomcoffee.pos.notification.dto.TableStatusNotificationDTO;
import com.bomcoffee.pos.table.controller.TableController.TableRequest;
import com.bomcoffee.pos.table.entity.RestaurantTable;
import com.bomcoffee.pos.table.entity.Zone;
import com.bomcoffee.pos.table.repository.TableRepository;
import com.bomcoffee.pos.table.repository.ZoneRepository;
import com.bomcoffee.pos.table.service.TableService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class TableServiceImpl implements TableService {

    private final TableRepository tableRepository;
    private final ZoneRepository zoneRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public List<RestaurantTable> getAllTables(boolean includeInactive) {
        List<RestaurantTable> all = tableRepository.findAllByOrderByNameAsc();
        if (includeInactive) {
            return all;
        }
        return all.stream().filter(RestaurantTable::isActive).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RestaurantTable getTableById(Long id) {
        return findTable(id);
    }

    @Override
    public RestaurantTable createTable(TableRequest request) {
        String name = requireName(request.getName());
        if (tableRepository.existsByNameIgnoreCase(name)) {
            throw new BusinessException("Tên bàn đã tồn tại", "TABLE_NAME_TAKEN");
        }
        TableType type = parseType(request.getType());
        Zone zone = resolveZone(request.getZoneId());

        RestaurantTable table = RestaurantTable.builder()
                .name(name)
                .type(type)
                .zone(zone)
                .capacity(normalizeCapacity(request.getCapacity()))
                .status(TableStatus.EMPTY)
                .active(request.getActive() == null || request.getActive())
                .build();
        return tableRepository.save(table);
    }

    @Override
    public RestaurantTable updateTable(Long id, TableRequest request) {
        RestaurantTable table = findTable(id);
        String name = requireName(request.getName());
        if (tableRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new BusinessException("Tên bàn đã tồn tại", "TABLE_NAME_TAKEN");
        }

        table.setName(name);
        table.setType(parseType(request.getType()));
        table.setZone(resolveZone(request.getZoneId()));
        table.setCapacity(normalizeCapacity(request.getCapacity()));
        if (request.getActive() != null) {
            if (!request.getActive() && table.getStatus() == TableStatus.SERVING) {
                throw new BusinessException("Không thể ẩn bàn đang phục vụ", "TABLE_BUSY");
            }
            table.setActive(request.getActive());
        }
        return tableRepository.save(table);
    }

    @Override
    public void deactivateTable(Long id) {
        RestaurantTable table = findTable(id);
        if (table.getStatus() == TableStatus.SERVING) {
            throw new BusinessException("Không thể xóa bàn đang phục vụ", "TABLE_BUSY");
        }
        table.setActive(false);
        tableRepository.save(table);
    }

    @Override
    public RestaurantTable updateTableStatus(Long id, Map<String, String> body) {
        RestaurantTable table = findTable(id);
        if (!table.isActive()) {
            throw new BusinessException("Bàn đã bị ẩn / vô hiệu", "TABLE_INACTIVE");
        }
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

    @Override
    @Transactional(readOnly = true)
    public List<Zone> getAllZones() {
        return zoneRepository.findAllByOrderByNameAsc();
    }

    private RestaurantTable findTable(Long id) {
        return tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn", id));
    }

    private Zone resolveZone(Long zoneId) {
        if (zoneId == null) {
            return null;
        }
        return zoneRepository.findById(zoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Khu vực", zoneId));
    }

    private String requireName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new BusinessException("Tên bàn không được để trống", "VALIDATION_ERROR");
        }
        return name.trim();
    }

    private TableType parseType(String type) {
        if (!StringUtils.hasText(type)) {
            throw new BusinessException("Loại bàn không được để trống", "VALIDATION_ERROR");
        }
        try {
            return TableType.valueOf(type.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Loại bàn không hợp lệ", "INVALID_TABLE_TYPE");
        }
    }

    private Integer normalizeCapacity(Integer capacity) {
        if (capacity == null) {
            return 0;
        }
        if (capacity < 0) {
            throw new BusinessException("Sức chứa không hợp lệ", "VALIDATION_ERROR");
        }
        return capacity;
    }
}
