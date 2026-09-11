package com.bomcoffee.pos.kds.controller;

import com.bomcoffee.pos.common.exception.BusinessException;
import com.bomcoffee.pos.common.response.ApiResponse;
import com.bomcoffee.pos.kds.service.KdsService;
import com.bomcoffee.pos.order.entity.OrderItem;
import com.bomcoffee.pos.user.entity.User;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/kds")
@RequiredArgsConstructor
public class KdsController {

    private final KdsService kdsService;

    @GetMapping("/queue")
    public ResponseEntity<ApiResponse<List<OrderItem>>> getQueue(
            @RequestParam(defaultValue = "false") boolean all,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(kdsService.getQueue(all, currentUser)));
    }

    @PatchMapping("/items/status")
    public ResponseEntity<ApiResponse<List<OrderItem>>> updateStatuses(
            @RequestBody(required = false) BatchStatusRequest body) {
        if (body == null) {
            throw new BusinessException("Thiếu dữ liệu cập nhật trạng thái", "MISSING_BODY");
        }
        List<OrderItem> saved = kdsService.updateStatuses(body.getItemIds(), body.getStatus());
        return ResponseEntity.ok(ApiResponse.success(saved, "Cập nhật trạng thái thành công"));
    }

    @PatchMapping("/items/{itemId}/status")
    public ResponseEntity<ApiResponse<OrderItem>> updateStatus(
            @PathVariable Long itemId,
            @RequestBody Map<String, String> body) {
        OrderItem saved = kdsService.updateStatus(itemId, body);
        return ResponseEntity.ok(ApiResponse.success(saved, "Cập nhật trạng thái thành công"));
    }

    @Data
    public static class BatchStatusRequest {
        private List<Long> itemIds;
        private String status;
    }
}
