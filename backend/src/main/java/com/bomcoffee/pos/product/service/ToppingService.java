package com.bomcoffee.pos.product.service;

import com.bomcoffee.pos.product.controller.ToppingController.ToppingRequest;
import com.bomcoffee.pos.product.entity.Topping;

import java.util.List;

public interface ToppingService {
    List<Topping> getAll(boolean includeInactive);
    Topping create(ToppingRequest request);
    Topping update(Long id, ToppingRequest request);
    void delete(Long id);
}
