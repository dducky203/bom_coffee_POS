package com.bomcoffee.pos.billiard.service;

import com.bomcoffee.pos.billiard.controller.BilliardPricingController.BilliardPricingRequest;
import com.bomcoffee.pos.billiard.entity.BilliardPricing;

import java.util.List;

public interface BilliardPricingService {
    List<BilliardPricing> getAll();
    BilliardPricing create(BilliardPricingRequest request);
    BilliardPricing update(Long id, BilliardPricingRequest request);
    void delete(Long id);
}
