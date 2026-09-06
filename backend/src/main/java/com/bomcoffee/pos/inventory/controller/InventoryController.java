package com.bomcoffee.pos.inventory.controller;

import com.bomcoffee.pos.common.response.ApiResponse;
import com.bomcoffee.pos.inventory.entity.Ingredient;
import com.bomcoffee.pos.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ingredients")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Ingredient>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAllIngredients()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Ingredient>> create(@RequestBody Ingredient ingredient) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.createIngredient(ingredient)));
    }

    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Ingredient>> updateStock(
            @PathVariable Long id,
            @RequestBody Map<String, BigDecimal> body) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.updateStock(id, body)));
    }
}
