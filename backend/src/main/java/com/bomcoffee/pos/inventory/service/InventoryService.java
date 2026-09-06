package com.bomcoffee.pos.inventory.service;

import com.bomcoffee.pos.inventory.entity.Ingredient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface InventoryService {
    List<Ingredient> getAllIngredients();
    Ingredient createIngredient(Ingredient ingredient);
    Ingredient updateStock(Long id, Map<String, BigDecimal> body);
}
