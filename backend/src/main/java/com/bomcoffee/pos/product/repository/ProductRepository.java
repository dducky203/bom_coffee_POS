package com.bomcoffee.pos.product.repository;

import com.bomcoffee.pos.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategoryIdAndActiveTrue(Long categoryId);
    List<Product> findByCategoryId(Long categoryId);
    List<Product> findByActiveTrue();
}
