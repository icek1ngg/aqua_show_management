package com.asms.identity.service.impl;

import com.asms.identity.service.PasswordResetEmailSender;
import com.asms.identity.service.PasswordResetMailEvents.PasswordChanged;
import com.asms.identity.service.PasswordResetMailEvents.ResetRequested;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class PasswordResetMailEventListener {

    private final PasswordResetEmailSender emailSender;

    public PasswordResetMailEventListener(PasswordResetEmailSender emailSender) {
        this.emailSender = emailSender;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onResetRequested(ResetRequested event) {
        emailSender.sendPasswordResetEmail(event.user(), event.rawToken());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPasswordChanged(PasswordChanged event) {
        emailSender.sendPasswordChangedEmail(event.user());
    }
}
