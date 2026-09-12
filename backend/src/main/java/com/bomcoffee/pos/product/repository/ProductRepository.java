package com.bomcoffee.pos.product.repository;

import com.bomcoffee.pos.product.entity.Product;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    @EntityGraph(attributePaths = "category")
    List<Product> findByCategoryIdAndActiveTrue(Long categoryId);

    @EntityGraph(attributePaths = "category")
    List<Product> findByCategoryId(Long categoryId);

    @EntityGraph(attributePaths = "category")
    List<Product> findByActiveTrue();

    @EntityGraph(attributePaths = "category")
    @Override
    List<Product> findAll();

    @EntityGraph(attributePaths = "category")
    List<Product> findByIdIn(Collection<Long> ids);
}
