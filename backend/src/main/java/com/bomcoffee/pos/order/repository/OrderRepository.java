package com.bomcoffee.pos.order.repository;

import com.bomcoffee.pos.order.entity.Order;
import com.bomcoffee.pos.common.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    Optional<Order> findByTableIdAndStatus(Long tableId, OrderStatus status);
    List<Order> findByStatus(OrderStatus status);

    @Query("""
            SELECT DISTINCT o FROM Order o
            LEFT JOIN FETCH o.table
            LEFT JOIN FETCH o.staff
            LEFT JOIN FETCH o.previousOrder
            LEFT JOIN FETCH o.items i
            LEFT JOIN FETCH i.product
            WHERE o.id = :id
            """)
    Optional<Order> findByIdWithItems(@Param("id") Long id);

    @Query("""
            SELECT DISTINCT o FROM Order o
            LEFT JOIN FETCH o.billiardSessions
            WHERE o.id = :id
            """)
    Optional<Order> findByIdWithBilliardSessions(@Param("id") Long id);

    @Query("""
            SELECT DISTINCT o FROM Order o
            LEFT JOIN FETCH o.payments p
            LEFT JOIN FETCH p.cashier
            WHERE o.id = :id
            """)
    Optional<Order> findByIdWithPayments(@Param("id") Long id);

    @Query("""
            SELECT DISTINCT o FROM Order o
            LEFT JOIN FETCH o.table
            LEFT JOIN FETCH o.staff
            LEFT JOIN FETCH o.items i
            LEFT JOIN FETCH i.product
            WHERE o.table.id = :tableId AND o.status = :status
            """)
    Optional<Order> findByTableIdAndStatusWithItems(
            @Param("tableId") Long tableId,
            @Param("status") OrderStatus status);

    @Query("""
            SELECT DISTINCT o FROM Order o
            LEFT JOIN FETCH o.table
            LEFT JOIN FETCH o.staff
            LEFT JOIN FETCH o.items i
            LEFT JOIN FETCH i.product
            WHERE o.status = :status
            """)
    List<Order> findByStatusWithItems(@Param("status") OrderStatus status);

    @Query("""
            SELECT DISTINCT o FROM Order o
            LEFT JOIN FETCH o.billiardSessions
            WHERE o.id IN :ids
            """)
    List<Order> findWithBilliardSessionsByIdIn(@Param("ids") Collection<Long> ids);

    @Query("SELECT o FROM Order o WHERE o.status IN ('COMPLETED', 'PAID') AND o.closedAt BETWEEN :from AND :to")
    List<Order> findCompletedOrdersBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            SELECT DISTINCT o FROM Order o
            LEFT JOIN FETCH o.items i
            LEFT JOIN FETCH i.product
            WHERE o.status IN ('COMPLETED', 'PAID') AND o.closedAt BETWEEN :from AND :to
            """)
    List<Order> findCompletedOrdersBetweenWithItems(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            SELECT DISTINCT o FROM Order o
            LEFT JOIN FETCH o.staff
            WHERE o.status IN ('COMPLETED', 'PAID') AND o.closedAt BETWEEN :from AND :to
            """)
    List<Order> findCompletedOrdersBetweenWithStaff(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT o FROM Order o WHERE o.table.id = :tableId AND o.status IN ('COMPLETED', 'PAID') AND o.closedAt >= :since ORDER BY o.closedAt DESC")
    List<Order> findRecentCompletedOrdersByTable(@Param("tableId") Long tableId, @Param("since") LocalDateTime since);

    Optional<Order> findFirstByTableIdAndStatusOrderByClosedAtDesc(Long tableId, OrderStatus status);
}
