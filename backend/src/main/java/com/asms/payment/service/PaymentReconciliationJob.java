package com.asms.payment.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class PaymentReconciliationJob {

    private static final Logger log = LoggerFactory.getLogger(PaymentReconciliationJob.class);

    private final PaymentService paymentService;

    public PaymentReconciliationJob(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @Scheduled(fixedDelayString = "${asms.payos.reconcile-delay-ms:90000}")
    public void reconcilePendingPayments() {
        try {
            paymentService.reconcilePendingPayments();
        } catch (Exception exception) {
            log.error("Automatic pending PayOS reconciliation run failed", exception);
        }

        try {
            paymentService.reconcileCapturedInventory();
        } catch (Exception exception) {
            log.error("Automatic captured inventory reconciliation run failed", exception);
        }
    }
}
