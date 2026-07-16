package com.asms.checkout.service;

import com.asms.checkout.dto.CheckoutDtos.StartPaymentRequest;
import com.asms.checkout.dto.CheckoutDtos.StartPaymentResponse;
import com.asms.identity.entity.User;

public interface CheckoutService {
    StartPaymentResponse startPayment(StartPaymentRequest request, User user);
}
