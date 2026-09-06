package com.bomcoffee.pos.history.service;

import com.bomcoffee.pos.history.controller.HistoryController.HistorySearchCriteria;
import com.bomcoffee.pos.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface HistoryService {
    Page<Order> searchOrders(HistorySearchCriteria criteria, Pageable pageable);
    Order getOrderDetailById(Long id);
}
