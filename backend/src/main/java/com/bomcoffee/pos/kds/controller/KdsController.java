package com.bomcoffee.pos.kds.controller;

import com.bomcoffee.pos.common.response.ApiResponse;
import com.bomcoffee.pos.kds.service.KdsService;
import com.bomcoffee.pos.order.entity.OrderItem;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/kds")
@RequiredArgsConstructor
public class KdsController {

    private final KdsService kdsService;

    @GetMapping("/queue")
    public ResponseEntity<ApiResponse<List<OrderItem>>> getQueue() {
        return ResponseEntity.ok(ApiResponse.success(kdsService.getQueue()));
    }

    @PatchMapping("/items/{itemId}/status")
    public ResponseEntity<ApiResponse<OrderItem>> updateStatus(
            @PathVariable Long itemId,
            @RequestBody Map<String, String> body) {
        OrderItem saved = kdsService.updateStatus(itemId, body);
        return ResponseEntity.ok(ApiResponse.success(saved, "Cập nhật trạng thái thành công"));
    }
}
