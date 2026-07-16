package com.asms.checkout.service;

import java.util.UUID;
import java.util.function.Supplier;

public interface CheckoutIdempotencyLockService {

    <T> T execute(UUID userId, String idempotencyKey, Supplier<T> action);
}
