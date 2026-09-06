package com.bomcoffee.pos.payment.controller;

import com.bomcoffee.pos.common.response.ApiResponse;
import com.bomcoffee.pos.payment.entity.Payment;
import com.bomcoffee.pos.payment.service.PaymentService;
import com.bomcoffee.pos.user.entity.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.bomcoffee.pos.common.enums.PaymentMethod;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/{id}/checkout")
    public ResponseEntity<ApiResponse<List<Payment>>> checkout(
            @PathVariable Long id,
            @Valid @RequestBody CheckoutRequest req,
            @AuthenticationPrincipal User cashier) {
        List<Payment> payments = paymentService.checkout(id, req, cashier);
        return ResponseEntity.ok(ApiResponse.success(payments, "Thanh toán thành công"));
    }

    @Data
    public static class CheckoutRequest {
        private BigDecimal discountAmount;
        @NotNull private List<PaymentDetail> payments;
    }

    @Data
    public static class PaymentDetail {
        @NotNull private PaymentMethod method;
        @NotNull private BigDecimal amount;
        private String note;
    }
}
