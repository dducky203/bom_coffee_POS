package com.bomcoffee.pos.payment.repository;

import com.bomcoffee.pos.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByOrderId(Long orderId);
    
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.order.id = :orderId")
    java.math.BigDecimal sumAmountByOrderId(Long orderId);
}
