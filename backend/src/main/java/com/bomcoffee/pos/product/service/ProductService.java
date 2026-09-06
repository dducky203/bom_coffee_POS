package com.bomcoffee.pos.product.service;

import com.bomcoffee.pos.product.controller.ProductController.ProductRequest;
import com.bomcoffee.pos.product.entity.Product;

import java.util.List;

public interface ProductService {
    List<Product> getAllProducts(Long categoryId, boolean includeInactive);
    Product getProductById(Long id);
    Product createProduct(ProductRequest request);
    Product updateProduct(Long id, ProductRequest request);
    void deleteProduct(Long id);
}
