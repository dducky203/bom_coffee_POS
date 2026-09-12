package com.bomcoffee.pos.table.service;

import com.bomcoffee.pos.table.controller.TableController.TableRequest;
import com.bomcoffee.pos.table.entity.RestaurantTable;
import com.bomcoffee.pos.table.entity.Zone;

import java.util.List;
import java.util.Map;

public interface TableService {
    List<RestaurantTable> getAllTables(boolean includeInactive);
    RestaurantTable getTableById(Long id);
    RestaurantTable createTable(TableRequest request);
    RestaurantTable updateTable(Long id, TableRequest request);
    void deactivateTable(Long id);
    RestaurantTable updateTableStatus(Long id, Map<String, String> body);
    List<Zone> getAllZones();
}
