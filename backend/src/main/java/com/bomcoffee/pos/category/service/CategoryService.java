package com.bomcoffee.pos.category.service;

import com.bomcoffee.pos.category.entity.Category;

import java.util.List;

public interface CategoryService {
    List<Category> getAllCategories(boolean includeInactive);
    Category createCategory(Category category);
    Category updateCategory(Long id, Category category);
    void deleteCategory(Long id);
}
