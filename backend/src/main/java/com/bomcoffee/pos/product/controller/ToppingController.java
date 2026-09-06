package com.bomcoffee.pos.product.controller;

import com.bomcoffee.pos.common.response.ApiResponse;
import com.bomcoffee.pos.product.entity.Topping;
import com.bomcoffee.pos.product.service.ToppingService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/toppings")
@RequiredArgsConstructor
public class ToppingController {

    private final ToppingService toppingService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Topping>>> getAll(
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        return ResponseEntity.ok(ApiResponse.success(toppingService.getAll(includeInactive)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Topping>> create(@RequestBody ToppingRequest request) {
        return ResponseEntity.ok(ApiResponse.success(toppingService.create(request), "Tạo topping thành công"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Topping>> update(@PathVariable Long id, @RequestBody ToppingRequest request) {
        return ResponseEntity.ok(ApiResponse.success(toppingService.update(id, request), "Cập nhật topping thành công"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        toppingService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Ẩn topping thành công"));
    }

    @Data
    public static class ToppingRequest {
        private String name;
        private BigDecimal extraPrice;
        private Boolean defaultTopping;
        private Boolean active;
        private Integer sortOrder;
    }
}
