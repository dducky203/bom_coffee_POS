package com.bomcoffee.pos.user.service.impl;

import com.bomcoffee.pos.common.exception.BusinessException;
import com.bomcoffee.pos.common.exception.ResourceNotFoundException;
import com.bomcoffee.pos.user.controller.UserController.CreateUserRequest;
import com.bomcoffee.pos.user.controller.UserController.ResetPasswordRequest;
import com.bomcoffee.pos.user.controller.UserController.UpdateUserRequest;
import com.bomcoffee.pos.user.dto.RoleResponse;
import com.bomcoffee.pos.user.dto.UserResponse;
import com.bomcoffee.pos.user.entity.Role;
import com.bomcoffee.pos.user.entity.User;
import com.bomcoffee.pos.user.repository.RoleRepository;
import com.bomcoffee.pos.user.repository.UserRepository;
import com.bomcoffee.pos.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private static final String ADMIN_ROLE = "ADMIN";
    private static final int MIN_PASSWORD_LENGTH = 6;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers(String keyword, String roleName, Boolean active) {
        String q = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(user -> !StringUtils.hasText(q) || matchesKeyword(user, q))
                .filter(user -> !StringUtils.hasText(roleName) || roleName.equalsIgnoreCase(user.getRole().getName()))
                .filter(user -> active == null || user.isActive() == active)
                .map(UserResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        return UserResponse.from(findUser(id));
    }

    @Override
    public UserResponse createUser(CreateUserRequest req) {
        String username = requireText(req.getUsername(), "Tên đăng nhập không được để trống").trim();
        String password = requireText(req.getPassword(), "Mật khẩu không được để trống");
        String fullName = requireText(req.getFullName(), "Họ tên không được để trống").trim();
        String roleName = requireText(req.getRoleName(), "Vai trò không được để trống").trim().toUpperCase(Locale.ROOT);

        if (username.length() < 3) {
            throw new BusinessException("Tên đăng nhập phải có ít nhất 3 ký tự", "USERNAME_TOO_SHORT");
        }
        if (userRepository.existsByUsername(username)) {
            throw new BusinessException("Tên đăng nhập đã tồn tại", "USERNAME_TAKEN");
        }
        validatePassword(password);

        Role role = findRole(roleName);
        User user = User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(password))
                .fullName(fullName)
                .phone(normalizePhone(req.getPhone()))
                .role(role)
                .active(true)
                .build();
        return UserResponse.from(userRepository.save(user));
    }

    @Override
    public UserResponse updateUser(Long id, UpdateUserRequest req, User currentUser) {
        User user = findUser(id);
        String fullName = requireText(req.getFullName(), "Họ tên không được để trống").trim();
        String roleName = requireText(req.getRoleName(), "Vai trò không được để trống").trim().toUpperCase(Locale.ROOT);
        Role role = findRole(roleName);

        boolean demotingLastAdmin = isAdmin(user)
                && !ADMIN_ROLE.equals(roleName)
                && isLastActiveAdmin(user);
        if (demotingLastAdmin) {
            throw new BusinessException("Không thể đổi vai trò admin cuối cùng đang hoạt động", "LAST_ADMIN");
        }

        boolean deactivatingSelf = Boolean.FALSE.equals(req.getActive())
                && currentUser != null
                && currentUser.getId().equals(id);
        if (deactivatingSelf) {
            throw new BusinessException("Không thể khóa tài khoản đang đăng nhập", "CANNOT_DISABLE_SELF");
        }

        boolean deactivatingLastAdmin = Boolean.FALSE.equals(req.getActive())
                && isAdmin(user)
                && user.isActive()
                && isLastActiveAdmin(user);
        if (deactivatingLastAdmin) {
            throw new BusinessException("Không thể khóa admin cuối cùng đang hoạt động", "LAST_ADMIN");
        }

        user.setFullName(fullName);
        user.setPhone(normalizePhone(req.getPhone()));
        user.setRole(role);
        if (req.getActive() != null) {
            user.setActive(req.getActive());
        }
        return UserResponse.from(userRepository.save(user));
    }

    @Override
    public UserResponse toggleActive(Long id, User currentUser) {
        if (currentUser != null && currentUser.getId().equals(id)) {
            throw new BusinessException("Không thể khóa tài khoản đang đăng nhập", "CANNOT_DISABLE_SELF");
        }
        User user = findUser(id);
        if (user.isActive() && isAdmin(user) && isLastActiveAdmin(user)) {
            throw new BusinessException("Không thể khóa admin cuối cùng đang hoạt động", "LAST_ADMIN");
        }
        user.setActive(!user.isActive());
        return UserResponse.from(userRepository.save(user));
    }

    @Override
    public UserResponse resetPassword(Long id, ResetPasswordRequest request) {
        String password = requireText(request.getNewPassword(), "Mật khẩu mới không được để trống");
        validatePassword(password);
        User user = findUser(id);
        user.setPasswordHash(passwordEncoder.encode(password));
        return UserResponse.from(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(RoleResponse::from)
                .toList();
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên", id));
    }

    private Role findRole(String roleName) {
        return roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò: " + roleName));
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && ADMIN_ROLE.equalsIgnoreCase(user.getRole().getName());
    }

    private boolean isLastActiveAdmin(User user) {
        long activeAdmins = userRepository.countByRole_NameAndActiveTrue(ADMIN_ROLE);
        return user.isActive() && isAdmin(user) && activeAdmins <= 1;
    }

    private boolean matchesKeyword(User user, String q) {
        return contains(user.getUsername(), q)
                || contains(user.getFullName(), q)
                || contains(user.getPhone(), q);
    }

    private boolean contains(String value, String q) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(q);
    }

    private String requireText(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new BusinessException(message, "VALIDATION_ERROR");
        }
        return value;
    }

    private void validatePassword(String password) {
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new BusinessException("Mật khẩu phải có ít nhất " + MIN_PASSWORD_LENGTH + " ký tự", "PASSWORD_TOO_SHORT");
        }
    }

    private String normalizePhone(String phone) {
        if (!StringUtils.hasText(phone)) {
            return null;
        }
        return phone.trim();
    }
}
