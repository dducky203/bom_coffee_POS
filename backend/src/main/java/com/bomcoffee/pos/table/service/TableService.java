package com.bomcoffee.pos.table.service;

import com.bomcoffee.pos.table.entity.RestaurantTable;
import java.util.List;
import java.util.Map;

public interface TableService {
    List<RestaurantTable> getAllTables();
    RestaurantTable getTableById(Long id);
    RestaurantTable updateTableStatus(Long id, Map<String, String> body);
}
