package com.bomcoffee.pos.inventory.service.impl;

import com.bomcoffee.pos.common.exception.ResourceNotFoundException;
import com.bomcoffee.pos.inventory.entity.Ingredient;
import com.bomcoffee.pos.inventory.repository.IngredientRepository;
import com.bomcoffee.pos.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final IngredientRepository ingredientRepository;

    @Override
    public List<Ingredient> getAllIngredients() {
        return ingredientRepository.findAll();
    }

    @Override
    public Ingredient createIngredient(Ingredient ingredient) {
        return ingredientRepository.save(ingredient);
    }

    @Override
    public Ingredient updateStock(Long id, Map<String, BigDecimal> body) {
        Ingredient ingredient = ingredientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ingredient", id));
        ingredient.setQuantityInStock(body.get("quantity"));
        return ingredientRepository.save(ingredient);
    }
}
