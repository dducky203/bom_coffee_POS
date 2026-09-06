package com.bomcoffee.pos.user.controller;

import com.bomcoffee.pos.common.response.ApiResponse;
import com.bomcoffee.pos.user.entity.User;
import com.bomcoffee.pos.user.service.UserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<User>> create(@RequestBody CreateUserRequest req) {
        return ResponseEntity.ok(ApiResponse.success(userService.createUser(req)));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<ApiResponse<User>> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.toggleActive(id)));
    }

    @Data
    public static class CreateUserRequest {
        private String username;
        private String password;
        private String fullName;
        private String phone;
        private String roleName;
    }
}
