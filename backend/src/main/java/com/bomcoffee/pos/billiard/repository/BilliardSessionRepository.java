package com.bomcoffee.pos.billiard.repository;

import com.bomcoffee.pos.billiard.entity.BilliardSession;
import com.bomcoffee.pos.common.enums.BilliardSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BilliardSessionRepository extends JpaRepository<BilliardSession, Long> {
    Optional<BilliardSession> findByTableIdAndStatus(Long tableId, BilliardSessionStatus status);
    List<BilliardSession> findByOrderIdAndStatus(Long orderId, BilliardSessionStatus status);
    List<BilliardSession> findByOrderIdOrderBySessionNoAsc(Long orderId);
    List<BilliardSession> findByTableIdAndOrderIsNull(Long tableId);
}
