package com.bomcoffee.pos.order.service;

import com.bomcoffee.pos.order.controller.OrderController.AddItemRequest;
import com.bomcoffee.pos.order.controller.OrderController.CreateOrderRequest;
import com.bomcoffee.pos.order.controller.OrderController.SubmitOrderRequest;
import com.bomcoffee.pos.order.entity.Order;
import com.bomcoffee.pos.order.entity.OrderItem;
import com.bomcoffee.pos.user.entity.User;

import java.util.List;

public interface OrderService {
    Order getOrderById(Long id);
    Order getActiveOrderByTable(Long tableId);
    Order getRecentCompletedOrderByTable(Long tableId, int withinMinutes);
    Order createOrder(CreateOrderRequest req, User currentUser);
    Order submitOrder(SubmitOrderRequest req, User currentUser);
    OrderItem addItemToOrder(Long orderId, AddItemRequest req, User currentUser);
    /** Hủy 1 món đã gửi bếp (hết hàng / khách đổi món) — soft cancel, giữ lịch sử. */
    Order cancelItem(Long orderId, Long itemId, User currentUser);
    /** Hủy cả đơn OPEN khi khách về / không dùng bàn nữa. */
    Order cancelOrder(Long orderId, User currentUser);
    List<Order> getAllOpenOrders();
}
