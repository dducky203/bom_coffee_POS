package com.bomcoffee.pos.user.controller;

import com.bomcoffee.pos.common.response.ApiResponse;
import com.bomcoffee.pos.user.dto.RoleResponse;
import com.bomcoffee.pos.user.dto.UserResponse;
import com.bomcoffee.pos.user.dto.UserStatsResponse;
import com.bomcoffee.pos.user.entity.User;
import com.bomcoffee.pos.user.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int pageSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(Math.max(page, 0), pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers(keyword, role, active, pageable)));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<UserStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(userService.getStats()));
    }

    @GetMapping("/roles")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getRoles() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllRoles()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody CreateUserRequest req) {
        return ResponseEntity.ok(ApiResponse.success(userService.createUser(req), "Tạo nhân viên thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest req,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateUser(id, req, currentUser), "Cập nhật nhân viên thành công"));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<ApiResponse<UserResponse>> toggleActive(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        UserResponse updated = userService.toggleActive(id, currentUser);
        String message = updated.active() ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản";
        return ResponseEntity.ok(ApiResponse.success(updated, message));
    }

    @PatchMapping("/{id}/password")
    public ResponseEntity<ApiResponse<UserResponse>> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest req) {
        return ResponseEntity.ok(ApiResponse.success(userService.resetPassword(id, req), "Đặt lại mật khẩu thành công"));
    }

    @Data
    public static class CreateUserRequest {
        @NotBlank(message = "Tên đăng nhập không được để trống")
        @Size(min = 3, max = 100)
        private String username;

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 6, max = 100)
        private String password;

        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 150)
        private String fullName;

        @Size(max = 20)
        private String phone;

        @NotBlank(message = "Vai trò không được để trống")
        private String roleName;
    }

    @Data
    public static class UpdateUserRequest {
        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 150)
        private String fullName;

        @Size(max = 20)
        private String phone;

        @NotBlank(message = "Vai trò không được để trống")
        private String roleName;

        private Boolean active;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Size(min = 6, max = 100)
        private String newPassword;
    }
}
