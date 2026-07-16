package com.asms.identity.service;

import com.asms.identity.entity.User;

public final class PasswordResetMailEvents {

    private PasswordResetMailEvents() {
    }

    public record ResetRequested(User user, String rawToken) {
    }

    public record PasswordChanged(User user) {
    }
}
