package com.bomcoffee.pos.product.repository;

import com.bomcoffee.pos.product.entity.Topping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ToppingRepository extends JpaRepository<Topping, Long> {
    List<Topping> findByActiveTrueOrderBySortOrderAsc();
    List<Topping> findAllByOrderBySortOrderAsc();
}
