package com.asms.payment;

import com.asms.payment.service.PaymentReconciliationJob;
import com.asms.payment.service.PaymentService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class PaymentReconciliationJobTest {

    @Test
    void capturedInventoryReconciliationStillRunsWhenProviderReconciliationFails() {
        PaymentService paymentService = mock(PaymentService.class);
        doThrow(new IllegalStateException("provider unavailable"))
                .when(paymentService).reconcilePendingPayments();
        PaymentReconciliationJob job = new PaymentReconciliationJob(paymentService);

        assertDoesNotThrow(job::reconcilePendingPayments);

        verify(paymentService).reconcilePendingPayments();
        verify(paymentService).reconcileCapturedInventory();
    }

    @Test
    void capturedInventoryFailureDoesNotEscapeTheScheduledJob() {
        PaymentService paymentService = mock(PaymentService.class);
        doThrow(new IllegalStateException("inventory unavailable"))
                .when(paymentService).reconcileCapturedInventory();
        PaymentReconciliationJob job = new PaymentReconciliationJob(paymentService);

        assertDoesNotThrow(job::reconcilePendingPayments);

        verify(paymentService).reconcilePendingPayments();
        verify(paymentService).reconcileCapturedInventory();
    }
}
