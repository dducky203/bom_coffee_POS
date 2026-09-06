package com.bomcoffee.pos.category.service.impl;

import com.bomcoffee.pos.category.entity.Category;
import com.bomcoffee.pos.category.repository.CategoryRepository;
import com.bomcoffee.pos.category.service.CategoryService;
import com.bomcoffee.pos.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public List<Category> getAllCategories(boolean includeInactive) {
        return includeInactive
                ? categoryRepository.findAllByOrderBySortOrderAsc()
                : categoryRepository.findByActiveTrueOrderBySortOrderAsc();
    }

    @Override
    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }

    @Override
    public Category updateCategory(Long id, Category body) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        category.setName(body.getName());
        category.setSortOrder(body.getSortOrder());
        category.setActive(body.isActive());
        return categoryRepository.save(category);
    }

    @Override
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        category.setActive(false);
        categoryRepository.save(category);
    }
}
