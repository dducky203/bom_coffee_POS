package com.bomcoffee.pos.inventory.repository;

import com.bomcoffee.pos.inventory.entity.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, Long> {
    
    @Query("SELECT i FROM Ingredient i WHERE i.quantityInStock <= i.minAlertQty")
    List<Ingredient> findIngredientsBelowAlertQuantity();
}
