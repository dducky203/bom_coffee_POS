package com.bomcoffee.pos.payment.service;

import com.bomcoffee.pos.payment.controller.PaymentController.CheckoutRequest;
import com.bomcoffee.pos.payment.entity.Payment;
import com.bomcoffee.pos.user.entity.User;

import java.util.List;

public interface PaymentService {
    List<Payment> checkout(Long orderId, CheckoutRequest request, User cashier);
}
