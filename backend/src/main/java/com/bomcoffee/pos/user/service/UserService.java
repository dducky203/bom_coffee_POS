package com.bomcoffee.pos.user.service;

import com.bomcoffee.pos.user.controller.UserController.CreateUserRequest;
import com.bomcoffee.pos.user.entity.User;

import java.util.List;

public interface UserService {
    List<User> getAllUsers();
    User createUser(CreateUserRequest request);
    User toggleActive(Long id);
}
