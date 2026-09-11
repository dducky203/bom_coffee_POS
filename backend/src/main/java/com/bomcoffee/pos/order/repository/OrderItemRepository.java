package com.bomcoffee.pos.order.repository;

import com.bomcoffee.pos.order.entity.OrderItem;
import com.bomcoffee.pos.common.enums.OrderItemStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);

    @EntityGraph(attributePaths = {"order", "order.table", "product"})
    List<OrderItem> findByIdIn(Collection<Long> ids);

    @Query("""
            SELECT DISTINCT i FROM OrderItem i
            LEFT JOIN FETCH i.order o
            LEFT JOIN FETCH o.table
            LEFT JOIN FETCH i.product
            WHERE i.status IN :statuses
            """)
    List<OrderItem> findByStatusInWithRelations(@Param("statuses") List<OrderItemStatus> statuses);

    @Query("""
            SELECT DISTINCT i FROM OrderItem i
            LEFT JOIN FETCH i.order o
            LEFT JOIN FETCH o.table
            LEFT JOIN FETCH i.product
            WHERE (i.status IN :todayStatuses AND i.createdAt >= :startOfToday)
               OR (i.status IN :carryStatuses AND i.createdAt < :startOfToday)
            """)
    List<OrderItem> findQueueWithRelations(
            @Param("todayStatuses") List<OrderItemStatus> todayStatuses,
            @Param("carryStatuses") List<OrderItemStatus> carryStatuses,
            @Param("startOfToday") LocalDateTime startOfToday);
}
