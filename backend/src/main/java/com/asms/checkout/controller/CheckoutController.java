package com.asms.checkout.controller;

import com.asms.checkout.dto.CheckoutDtos.StartPaymentRequest;
import com.asms.checkout.dto.CheckoutDtos.StartPaymentResponse;
import com.asms.checkout.service.CheckoutService;
import com.asms.identity.entity.User;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {
    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping("/start-payment")
    public ResponseEntity<StartPaymentResponse> startPayment(
            @RequestBody @Valid StartPaymentRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(checkoutService.startPayment(request, user));
    }
}
