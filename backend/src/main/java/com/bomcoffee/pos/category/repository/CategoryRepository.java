package com.bomcoffee.pos.category.repository;

import com.bomcoffee.pos.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByActiveTrueOrderBySortOrderAsc();
    List<Category> findAllByOrderBySortOrderAsc();
}
