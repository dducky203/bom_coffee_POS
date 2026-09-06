package com.bomcoffee.pos.user.service.impl;

import com.bomcoffee.pos.common.exception.BusinessException;
import com.bomcoffee.pos.common.exception.ResourceNotFoundException;
import com.bomcoffee.pos.user.controller.UserController.CreateUserRequest;
import com.bomcoffee.pos.user.entity.Role;
import com.bomcoffee.pos.user.entity.User;
import com.bomcoffee.pos.user.repository.RoleRepository;
import com.bomcoffee.pos.user.repository.UserRepository;
import com.bomcoffee.pos.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User createUser(CreateUserRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new BusinessException("Tên đăng nhập đã tồn tại", "USERNAME_TAKEN");
        }
        Role role = roleRepository.findByName(req.getRoleName())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + req.getRoleName()));

        User user = User.builder()
                .username(req.getUsername())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .role(role)
                .active(true)
                .build();
        return userRepository.save(user);
    }

    @Override
    public User toggleActive(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setActive(!user.isActive());
        return userRepository.save(user);
    }
}
