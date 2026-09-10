package com.bomcoffee.pos.billiard.repository;

import com.bomcoffee.pos.billiard.entity.BilliardSession;
import com.bomcoffee.pos.common.enums.BilliardSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BilliardSessionRepository extends JpaRepository<BilliardSession, Long> {
    @Query("SELECT s FROM BilliardSession s JOIN FETCH s.table t WHERE t.id = :tableId AND s.status = :status ORDER BY s.id DESC")
    List<BilliardSession> findAllByTableIdAndStatus(@Param("tableId") Long tableId, @Param("status") BilliardSessionStatus status);

    default Optional<BilliardSession> findByTableIdAndStatus(Long tableId, BilliardSessionStatus status) {
        return findAllByTableIdAndStatus(tableId, status).stream().findFirst();
    }

    List<BilliardSession> findByOrderIdAndStatus(Long orderId, BilliardSessionStatus status);
    List<BilliardSession> findByOrderIdOrderBySessionNoAsc(Long orderId);

    @Query("SELECT s FROM BilliardSession s WHERE s.table.id = :tableId AND s.order IS NULL AND s.status = :status")
    List<BilliardSession> findByTableIdAndOrderIsNullAndStatus(
            @Param("tableId") Long tableId,
            @Param("status") BilliardSessionStatus status);
}
