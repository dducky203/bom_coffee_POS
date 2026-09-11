package com.bomcoffee.pos.kds.service;

import com.bomcoffee.pos.order.entity.OrderItem;
import com.bomcoffee.pos.user.entity.User;

import java.util.List;
import java.util.Map;

public interface KdsService {
    List<OrderItem> getQueue(boolean all, User currentUser);
    OrderItem updateStatus(Long itemId, Map<String, String> body);
    List<OrderItem> updateStatuses(List<Long> itemIds, String status);
}
