package com.bomcoffee.pos.billiard.service.impl;

import com.bomcoffee.pos.billiard.controller.BilliardPricingController.BilliardPricingRequest;
import com.bomcoffee.pos.billiard.entity.BilliardPricing;
import com.bomcoffee.pos.billiard.repository.BilliardPricingRepository;
import com.bomcoffee.pos.billiard.service.BilliardPricingService;
import com.bomcoffee.pos.common.enums.TableType;
import com.bomcoffee.pos.common.exception.BusinessException;
import com.bomcoffee.pos.common.exception.ResourceNotFoundException;
import com.bomcoffee.pos.table.entity.RestaurantTable;
import com.bomcoffee.pos.table.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BilliardPricingServiceImpl implements BilliardPricingService {

    private final BilliardPricingRepository pricingRepository;
    private final TableRepository tableRepository;

    @Override
    public List<BilliardPricing> getAll() {
        List<BilliardPricing> prices = pricingRepository.findAll();
        prices.forEach(p -> {
            if (p.getTable() != null) {
                p.getTable().getName();
            }
        });
        return prices;
    }

    @Override
    public BilliardPricing create(BilliardPricingRequest request) {
        validate(request);
        BilliardPricing pricing = BilliardPricing.builder()
                .table(resolveTable(request.getTableId()))
                .dayType(request.getDayType())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .pricePerHour(request.getPricePerHour())
                .build();
        BilliardPricing saved = pricingRepository.save(pricing);
        if (saved.getTable() != null) {
            saved.getTable().getName();
        }
        return saved;
    }

    @Override
    public BilliardPricing update(Long id, BilliardPricingRequest request) {
        validate(request);
        BilliardPricing pricing = pricingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BilliardPricing", id));
        pricing.setTable(resolveTable(request.getTableId()));
        pricing.setDayType(request.getDayType());
        pricing.setStartTime(request.getStartTime());
        pricing.setEndTime(request.getEndTime());
        pricing.setPricePerHour(request.getPricePerHour());
        BilliardPricing saved = pricingRepository.save(pricing);
        if (saved.getTable() != null) {
            saved.getTable().getName();
        }
        return saved;
    }

    @Override
    public void delete(Long id) {
        BilliardPricing pricing = pricingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BilliardPricing", id));
        pricingRepository.delete(pricing);
    }

    private RestaurantTable resolveTable(Long tableId) {
        if (tableId == null) {
            return null;
        }
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Table", tableId));
        if (table.getType() != TableType.BILLIARD) {
            throw new BusinessException("Chỉ được gán giá cho bàn bi-a", "INVALID_TABLE_TYPE");
        }
        return table;
    }

    private void validate(BilliardPricingRequest request) {
        if (request.getDayType() == null || request.getStartTime() == null || request.getEndTime() == null) {
            throw new BusinessException("Thiếu loại ngày hoặc khung giờ", "INVALID_PRICING");
        }
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new BusinessException("Giờ bắt đầu phải trước giờ kết thúc", "INVALID_TIME_RANGE");
        }
        if (request.getPricePerHour() == null || request.getPricePerHour().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Giá theo giờ phải lớn hơn 0", "INVALID_PRICE");
        }
    }
}
