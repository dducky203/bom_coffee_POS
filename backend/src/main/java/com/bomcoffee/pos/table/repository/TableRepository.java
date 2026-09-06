package com.bomcoffee.pos.table.repository;

import com.bomcoffee.pos.table.entity.RestaurantTable;
import com.bomcoffee.pos.common.enums.TableType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TableRepository extends JpaRepository<RestaurantTable, Long> {
    List<RestaurantTable> findByType(TableType type);
    List<RestaurantTable> findByZoneId(Long zoneId);
}
