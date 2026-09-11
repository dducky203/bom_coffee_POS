package com.bomcoffee.pos.user.repository;

import com.bomcoffee.pos.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    List<User> findAllByOrderByCreatedAtDesc();
    long countByRole_NameAndActiveTrue(String roleName);
    long countByActiveTrue();
    long countByActiveFalse();
}
