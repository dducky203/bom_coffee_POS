package com.bomcoffee.pos.table.repository;

import com.bomcoffee.pos.common.enums.TableType;
import com.bomcoffee.pos.table.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TableRepository extends JpaRepository<RestaurantTable, Long> {
    List<RestaurantTable> findByType(TableType type);
    List<RestaurantTable> findByZoneId(Long zoneId);
    List<RestaurantTable> findAllByOrderByNameAsc();
    Optional<RestaurantTable> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
