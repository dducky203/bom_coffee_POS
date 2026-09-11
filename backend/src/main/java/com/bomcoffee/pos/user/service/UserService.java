package com.bomcoffee.pos.user.service;

import com.bomcoffee.pos.user.controller.UserController.CreateUserRequest;
import com.bomcoffee.pos.user.controller.UserController.ResetPasswordRequest;
import com.bomcoffee.pos.user.controller.UserController.UpdateUserRequest;
import com.bomcoffee.pos.user.dto.RoleResponse;
import com.bomcoffee.pos.user.dto.UserResponse;
import com.bomcoffee.pos.user.dto.UserStatsResponse;
import com.bomcoffee.pos.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {
    Page<UserResponse> getAllUsers(String keyword, String roleName, Boolean active, Pageable pageable);
    UserStatsResponse getStats();
    UserResponse getUserById(Long id);
    UserResponse createUser(CreateUserRequest request);
    UserResponse updateUser(Long id, UpdateUserRequest request, User currentUser);
    UserResponse toggleActive(Long id, User currentUser);
    UserResponse resetPassword(Long id, ResetPasswordRequest request);
    List<RoleResponse> getAllRoles();
}
