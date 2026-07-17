package com.asms.payment.service;

import com.asms.booking.entity.Booking;
import com.asms.identity.entity.User;
import com.asms.payment.dto.CreatePaymentRequest;
import com.asms.payment.dto.CreatePaymentResponse;
import com.asms.payment.dto.PayOsCallbackRequest;
import com.asms.payment.dto.PaymentCallbackResponse;
import com.asms.payment.dto.PaymentReconcileRequest;
import com.asms.payment.dto.PaymentReconcileResponse;

public interface PaymentService {

    record PaymentCreationOutcome(
            CreatePaymentResponse response,
            boolean providerSessionCreated
    ) {}

    CreatePaymentResponse createPayment(CreatePaymentRequest request, User user);

    PaymentCreationOutcome createOrGetPaymentSession(Booking booking);

    void cancelPaymentSessionBestEffort(String orderCode, String reason);

    PaymentCallbackResponse processCallback(PayOsCallbackRequest request);

    PaymentReconcileResponse reconcilePayment(PaymentReconcileRequest request, User user);

    void reconcilePendingPayments();
}
