package com.bomcoffee.pos.payment.repository;

import com.bomcoffee.pos.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByOrderId(Long orderId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.order.id = :orderId")
    BigDecimal sumAmountByOrderId(@Param("orderId") Long orderId);

    @Query("""
            SELECT p.method, COALESCE(SUM(p.amount), 0)
            FROM Payment p
            JOIN p.order o
            WHERE o.status IN ('COMPLETED', 'PAID')
              AND o.closedAt >= :from AND o.closedAt < :to
            GROUP BY p.method
            """)
    List<Object[]> sumAmountGroupedByMethod(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
