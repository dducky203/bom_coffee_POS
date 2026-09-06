package com.bomcoffee.pos.product.controller;

import com.bomcoffee.pos.common.response.ApiResponse;
import com.bomcoffee.pos.product.entity.Product;
import com.bomcoffee.pos.product.service.ProductService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Product>>> getAll(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        return ResponseEntity.ok(ApiResponse.success(productService.getAllProducts(categoryId, includeInactive)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(productService.getProductById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Product>> create(@RequestBody ProductRequest req) {
        return ResponseEntity.ok(ApiResponse.success(productService.createProduct(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Product>> update(@PathVariable Long id, @RequestBody ProductRequest req) {
        return ResponseEntity.ok(ApiResponse.success(productService.updateProduct(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa sản phẩm thành công"));
    }

    @Data
    public static class ProductRequest {
        private Long categoryId;
        private String name;
        private String description;
        private String imageUrl;
        private BigDecimal basePrice;
        private Boolean active;
        private Boolean hasDrinkOptions;
    }
}
