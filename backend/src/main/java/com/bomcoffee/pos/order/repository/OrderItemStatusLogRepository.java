package com.bomcoffee.pos.order.repository;

import com.bomcoffee.pos.order.entity.OrderItemStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemStatusLogRepository extends JpaRepository<OrderItemStatusLog, Long> {
    List<OrderItemStatusLog> findByOrderItemIdOrderByChangedAtDesc(Long orderItemId);
}
