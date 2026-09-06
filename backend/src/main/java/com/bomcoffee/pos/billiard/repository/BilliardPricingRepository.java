package com.bomcoffee.pos.billiard.repository;

import com.bomcoffee.pos.billiard.entity.BilliardPricing;
import com.bomcoffee.pos.common.enums.DayType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.Optional;

@Repository
public interface BilliardPricingRepository extends JpaRepository<BilliardPricing, Long> {
    @Query("SELECT p FROM BilliardPricing p WHERE p.dayType = :dayType AND :time BETWEEN p.startTime AND p.endTime AND (p.table IS NULL OR p.table.id = :tableId) ORDER BY p.table.id NULLS LAST")
    Optional<BilliardPricing> findApplicable(@Param("tableId") Long tableId,
                                              @Param("dayType") DayType dayType,
                                              @Param("time") LocalTime time);
}
