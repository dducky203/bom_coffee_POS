package com.bomcoffee.pos.product.service.impl;

import com.bomcoffee.pos.common.exception.BusinessException;
import com.bomcoffee.pos.common.exception.ResourceNotFoundException;
import com.bomcoffee.pos.product.controller.ToppingController.ToppingRequest;
import com.bomcoffee.pos.product.entity.Topping;
import com.bomcoffee.pos.product.repository.ToppingRepository;
import com.bomcoffee.pos.product.service.ToppingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ToppingServiceImpl implements ToppingService {

    private final ToppingRepository toppingRepository;

    @Override
    public List<Topping> getAll(boolean includeInactive) {
        return includeInactive
                ? toppingRepository.findAllByOrderBySortOrderAsc()
                : toppingRepository.findByActiveTrueOrderBySortOrderAsc();
    }

    @Override
    public Topping create(ToppingRequest request) {
        validate(request);
        Topping topping = Topping.builder()
                .name(request.getName().trim())
                .extraPrice(request.getExtraPrice())
                .defaultTopping(Boolean.TRUE.equals(request.getDefaultTopping()))
                .active(request.getActive() == null || request.getActive())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();
        return toppingRepository.save(topping);
    }

    @Override
    public Topping update(Long id, ToppingRequest request) {
        validate(request);
        Topping topping = toppingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topping", id));
        topping.setName(request.getName().trim());
        topping.setExtraPrice(request.getExtraPrice());
        if (request.getDefaultTopping() != null) topping.setDefaultTopping(request.getDefaultTopping());
        if (request.getActive() != null) topping.setActive(request.getActive());
        if (request.getSortOrder() != null) topping.setSortOrder(request.getSortOrder());
        return toppingRepository.save(topping);
    }

    @Override
    public void delete(Long id) {
        Topping topping = toppingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topping", id));
        topping.setActive(false);
        toppingRepository.save(topping);
    }

    private void validate(ToppingRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new BusinessException("Tên topping là bắt buộc", "INVALID_TOPPING");
        }
        if (request.getExtraPrice() == null || request.getExtraPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Giá topping không hợp lệ", "INVALID_TOPPING_PRICE");
        }
    }
}
