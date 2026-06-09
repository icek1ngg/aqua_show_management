package com.asms.payment.controller;

import com.asms.core.response.ApiResponse;
import com.asms.identity.entity.User;
import com.asms.payment.dto.CreatePaymentRequest;
import com.asms.payment.dto.CreatePaymentResponse;
import com.asms.payment.dto.PayOsCallbackRequest;
import com.asms.payment.dto.PaymentCallbackResponse;
import com.asms.payment.dto.PaymentReconcileRequest;
import com.asms.payment.dto.PaymentReconcileResponse;
import com.asms.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create")
    public ApiResponse<CreatePaymentResponse> createPayment(@Valid @RequestBody CreatePaymentRequest request, @AuthenticationPrincipal User user) {
        return ApiResponse.success("Payment link created", paymentService.createPayment(request, user));
    }

    @PostMapping("/callback")
    public ApiResponse<PaymentCallbackResponse> callback(@Valid @RequestBody PayOsCallbackRequest request) {
        return ApiResponse.success("PayOS callback processed", paymentService.processCallback(request));
    }

    @PostMapping("/reconcile")
    public ApiResponse<PaymentReconcileResponse> reconcile(
            @Valid @RequestBody PaymentReconcileRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ApiResponse.success("Payment reconciliation completed", paymentService.reconcilePayment(request, user));
    }
}
