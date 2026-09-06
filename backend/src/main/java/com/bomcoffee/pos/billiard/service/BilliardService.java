package com.bomcoffee.pos.billiard.service;

import com.bomcoffee.pos.billiard.entity.BilliardSession;
import com.bomcoffee.pos.user.entity.User;

import java.util.Map;

public interface BilliardService {
    BilliardSession startSession(Long tableId, User currentUser);
    BilliardSession stopSession(Long tableId);
    Map<String, Object> getCurrentSession(Long tableId);
}
