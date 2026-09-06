package com.bomcoffee.pos.kds.service;

import com.bomcoffee.pos.order.entity.OrderItem;

import java.util.List;
import java.util.Map;

public interface KdsService {
    List<OrderItem> getQueue();
    OrderItem updateStatus(Long itemId, Map<String, String> body);
}
