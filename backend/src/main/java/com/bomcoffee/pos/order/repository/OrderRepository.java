package com.bomcoffee.pos.order.repository;

import com.bomcoffee.pos.order.entity.Order;
import com.bomcoffee.pos.common.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    Optional<Order> findByTableIdAndStatus(Long tableId, OrderStatus status);
    List<Order> findByStatus(OrderStatus status);

    @Query("SELECT o FROM Order o WHERE o.status IN ('COMPLETED', 'PAID') AND o.closedAt BETWEEN :from AND :to")
    List<Order> findCompletedOrdersBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT o FROM Order o WHERE o.table.id = :tableId AND o.status IN ('COMPLETED', 'PAID') AND o.closedAt >= :since ORDER BY o.closedAt DESC")
    List<Order> findRecentCompletedOrdersByTable(@Param("tableId") Long tableId, @Param("since") LocalDateTime since);
    
    Optional<Order> findFirstByTableIdAndStatusOrderByClosedAtDesc(Long tableId, OrderStatus status);
}
