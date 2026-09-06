package com.bomcoffee.pos.billiard.controller;

import com.bomcoffee.pos.billiard.entity.BilliardSession;
import com.bomcoffee.pos.billiard.service.BilliardService;
import com.bomcoffee.pos.common.response.ApiResponse;
import com.bomcoffee.pos.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/billiard")
@RequiredArgsConstructor
public class BilliardController {

    private final BilliardService billiardService;

    @PostMapping("/{tableId}/start")
    public ResponseEntity<ApiResponse<BilliardSession>> startSession(
            @PathVariable Long tableId,
            @AuthenticationPrincipal User currentUser) {
        BilliardSession saved = billiardService.startSession(tableId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(saved, "Bắt đầu phiên chơi bi-a"));
    }

    @PostMapping("/{tableId}/stop")
    public ResponseEntity<ApiResponse<BilliardSession>> stopSession(@PathVariable Long tableId) {
        BilliardSession saved = billiardService.stopSession(tableId);
        return ResponseEntity.ok(ApiResponse.success(saved, "Kết thúc phiên chơi. Tổng tiền: " + saved.getTotalAmount()));
    }

    @GetMapping("/{tableId}/current")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentSession(@PathVariable Long tableId) {
        Map<String, Object> data = billiardService.getCurrentSession(tableId);
        if (data != null) {
            return ResponseEntity.ok(ApiResponse.success(data));
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Không có phiên đang chơi"));
    }
}
