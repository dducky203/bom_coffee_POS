package com.bomcoffee.pos.billiard.controller;

import com.bomcoffee.pos.billiard.entity.BilliardPricing;
import com.bomcoffee.pos.billiard.service.BilliardPricingService;
import com.bomcoffee.pos.common.enums.DayType;
import com.bomcoffee.pos.common.response.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/billiard-pricing")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class BilliardPricingController {

    private final BilliardPricingService billiardPricingService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BilliardPricing>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(billiardPricingService.getAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BilliardPricing>> create(@Valid @RequestBody BilliardPricingRequest request) {
        return ResponseEntity.ok(ApiResponse.success(billiardPricingService.create(request), "Tạo bảng giá bi-a thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BilliardPricing>> update(
            @PathVariable Long id,
            @Valid @RequestBody BilliardPricingRequest request) {
        return ResponseEntity.ok(ApiResponse.success(billiardPricingService.update(id, request), "Cập nhật bảng giá thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        billiardPricingService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa bảng giá thành công"));
    }

    @Data
    public static class BilliardPricingRequest {
        private Long tableId;
        @NotNull private DayType dayType;
        @NotNull private LocalTime startTime;
        @NotNull private LocalTime endTime;
        @NotNull @Positive private BigDecimal pricePerHour;
    }
}
