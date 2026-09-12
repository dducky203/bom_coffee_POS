package com.bomcoffee.pos.table.repository;

import com.bomcoffee.pos.table.entity.Zone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ZoneRepository extends JpaRepository<Zone, Long> {
    List<Zone> findAllByOrderByNameAsc();
}
