package com.bomcoffee.pos.product.service.impl;

import com.bomcoffee.pos.category.entity.Category;
import com.bomcoffee.pos.category.repository.CategoryRepository;
import com.bomcoffee.pos.common.exception.BusinessException;
import com.bomcoffee.pos.common.exception.ResourceNotFoundException;
import com.bomcoffee.pos.product.controller.ProductController.ProductRequest;
import com.bomcoffee.pos.product.entity.Product;
import com.bomcoffee.pos.product.repository.ProductRepository;
import com.bomcoffee.pos.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public List<Product> getAllProducts(Long categoryId, boolean includeInactive) {
        List<Product> products;
        if (categoryId != null) {
            products = includeInactive
                    ? productRepository.findByCategoryId(categoryId)
                    : productRepository.findByCategoryIdAndActiveTrue(categoryId);
        } else {
            products = includeInactive ? productRepository.findAll() : productRepository.findByActiveTrue();
        }
        products.forEach(p -> {
            if (p.getCategory() != null) {
                p.getCategory().getName();
            }
        });
        return products;
    }

    @Override
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    @Override
    public Product createProduct(ProductRequest req) {
        if (req.getName() == null || req.getName().isBlank() || req.getCategoryId() == null || req.getBasePrice() == null) {
            throw new BusinessException("Tên món, danh mục và giá là bắt buộc", "INVALID_PRODUCT");
        }
        Category category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", req.getCategoryId()));
        Product product = Product.builder()
                .category(category)
                .name(req.getName())
                .description(req.getDescription())
                .imageUrl(req.getImageUrl())
                .basePrice(req.getBasePrice())
                .active(req.getActive() == null || req.getActive())
                .hasDrinkOptions(req.getHasDrinkOptions() == null || req.getHasDrinkOptions())
                .build();
        return productRepository.save(product);
    }

    @Override
    public Product updateProduct(Long id, ProductRequest req) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        if (req.getCategoryId() != null) {
            Category category = categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", req.getCategoryId()));
            product.setCategory(category);
        }
        if (req.getName() != null) product.setName(req.getName());
        if (req.getBasePrice() != null) product.setBasePrice(req.getBasePrice());
        if (req.getImageUrl() != null) product.setImageUrl(req.getImageUrl());
        if (req.getDescription() != null) product.setDescription(req.getDescription());
        if (req.getActive() != null) product.setActive(req.getActive());
        if (req.getHasDrinkOptions() != null) product.setHasDrinkOptions(req.getHasDrinkOptions());
        return productRepository.save(product);
    }

    @Override
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setActive(false);
        productRepository.save(product);
    }
}
