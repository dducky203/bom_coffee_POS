package com.bomcoffee.pos.order.repository;

import com.bomcoffee.pos.order.entity.OrderItem;
import com.bomcoffee.pos.common.enums.OrderItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByStatusIn(List<OrderItemStatus> statuses);
    List<OrderItem> findByOrderId(Long orderId);
}
