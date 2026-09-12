package com.bomcoffee.pos.order.controller;

import com.bomcoffee.pos.common.enums.PaymentMethod;
import com.bomcoffee.pos.common.response.ApiResponse;
import com.bomcoffee.pos.order.entity.Order;
import com.bomcoffee.pos.order.entity.OrderItem;
import com.bomcoffee.pos.order.service.OrderService;
import com.bomcoffee.pos.user.entity.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Order>> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrderById(id)));
    }

    @GetMapping("/table/{tableId}")
    public ResponseEntity<ApiResponse<Order>> getActiveOrderByTable(@PathVariable Long tableId) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getActiveOrderByTable(tableId)));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<Order>> submit(
            @Valid @RequestBody SubmitOrderRequest req,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(orderService.submitOrder(req, currentUser), "Gửi order thành công"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Order>> createOrder(
            @Valid @RequestBody CreateOrderRequest req,
            @AuthenticationPrincipal User currentUser) {
        Order saved = orderService.createOrder(req, currentUser);
        return ResponseEntity.ok(ApiResponse.success(saved, "Tạo đơn hàng thành công"));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<ApiResponse<OrderItem>> addItem(
            @PathVariable Long id,
            @Valid @RequestBody AddItemRequest req,
            @AuthenticationPrincipal User currentUser) {
        OrderItem saved = orderService.addItemToOrder(id, req, currentUser);
        return ResponseEntity.ok(ApiResponse.success(saved, "Thêm món thành công"));
    }

    @PostMapping("/{id}/items/{itemId}/cancel")
    public ResponseEntity<ApiResponse<Order>> cancelItem(
            @PathVariable Long id,
            @PathVariable Long itemId,
            @AuthenticationPrincipal User currentUser) {
        Order order = orderService.cancelItem(id, itemId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(order, "Đã hủy món"));
    }

    /** Giữ DELETE cũ: soft-cancel món (tương thích FE cũ). */
    @DeleteMapping("/{id}/items/{itemId}")
    public ResponseEntity<ApiResponse<Order>> removeItem(
            @PathVariable Long id,
            @PathVariable Long itemId,
            @AuthenticationPrincipal User currentUser) {
        Order order = orderService.cancelItem(id, itemId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(order, "Đã hủy món"));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Order>> cancelOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        Order order = orderService.cancelOrder(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(order, "Đã hủy đơn hàng"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Order>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(orderService.getAllOpenOrders()));
    }

    @GetMapping("/table/{tableId}/recent-completed")
    public ResponseEntity<ApiResponse<Order>> getRecentCompletedOrder(
            @PathVariable Long tableId,
            @RequestParam(defaultValue = "30") int withinMinutes) {
        Order order = orderService.getRecentCompletedOrderByTable(tableId, withinMinutes);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    // DTOs
    @Data
    public static class CreateOrderRequest {
        @NotNull private Long tableId;
        private Long previousOrderId; // Đơn trước đó cùng bàn (khi khách gọi thêm sau khi đã thanh toán)
    }

    @Data
    public static class AddItemRequest {
        @NotNull private Long productId;
        @Positive private Integer quantity = 1;
        private String note;
        private Integer icePercent;
        private Integer sugarPercent;
        private List<Long> toppingIds;
    }

    @Data
    public static class SubmitOrderRequest {
        @NotNull private Long tableId;
        @NotNull private List<AddItemRequest> items;
        private boolean payNow;
        private PaymentMethod method;
        private String customerName;
    }
}
