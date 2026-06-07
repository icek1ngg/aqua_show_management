package com.asms.payment.service;

import com.asms.identity.entity.User;
import com.asms.payment.dto.CreatePaymentRequest;
import com.asms.payment.dto.CreatePaymentResponse;
import com.asms.payment.dto.PayOsCallbackRequest;
import com.asms.payment.dto.PaymentCallbackResponse;
import com.asms.payment.dto.PaymentReconcileRequest;
import com.asms.payment.dto.PaymentReconcileResponse;

public interface PaymentService {

    CreatePaymentResponse createPayment(CreatePaymentRequest request, User user);

    PaymentCallbackResponse processCallback(PayOsCallbackRequest request);

    PaymentReconcileResponse reconcilePayment(PaymentReconcileRequest request, User user);

    void reconcilePendingPayments();
}
