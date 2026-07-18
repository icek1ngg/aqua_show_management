package com.asms.booking.service;

import com.asms.booking.entity.Booking;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.repository.BookingRepository;
import com.asms.payment.entity.Payment;
import com.asms.payment.enums.PaymentStatus;
import com.asms.payment.integration.PayOsClient;
import com.asms.payment.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class BookingExpirationProcessor {

    private static final Logger log = LoggerFactory.getLogger(BookingExpirationProcessor.class);

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final RedisTicketHoldService redisTicketHoldService;
    private final PayOsClient payOsClient;

    public BookingExpirationProcessor(
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            RedisTicketHoldService redisTicketHoldService,
            PayOsClient payOsClient
    ) {
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.redisTicketHoldService = redisTicketHoldService;
        this.payOsClient = payOsClient;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean expireIfOverdue(UUID bookingId, Instant now) {
        Payment payment = paymentRepository.findByBookingIdForUpdate(bookingId).orElse(null);
        Booking booking = bookingRepository.findByIdForUpdate(bookingId).orElse(null);
        if (booking == null
                || booking.getStatus() != BookingStatus.PENDING_PAYMENT
                || booking.getExpiresAt().isAfter(now)) {
            return false;
        }

        if (payment != null && payment.getStatus() != PaymentStatus.PENDING
                && payment.getStatus() != PaymentStatus.EXPIRED) {
            log.info(
                    "Skipping overdue booking expiration because payment is terminal: bookingId={}, paymentStatus={}",
                    bookingId,
                    payment.getStatus()
            );
            return false;
        }

        boolean cancelProviderSession = payment != null && payment.getStatus() == PaymentStatus.PENDING;
        if (cancelProviderSession) {
            payment.setStatus(PaymentStatus.EXPIRED);
            paymentRepository.save(payment);
        }
        booking.setStatus(BookingStatus.EXPIRED);
        bookingRepository.save(booking);

        List<String> holdIds = booking.getItems().stream()
                .map(item -> item.getHoldId())
                .filter(holdId -> holdId != null && !holdId.isBlank())
                .distinct()
                .toList();
        String orderCode = cancelProviderSession ? payment.getPayosOrderCode() : null;
        runAfterCommit(() -> cleanupAfterExpiration(bookingId, holdIds, orderCode));
        return true;
    }

    private void cleanupAfterExpiration(UUID bookingId, List<String> holdIds, String orderCode) {
        for (String holdId : holdIds) {
            try {
                redisTicketHoldService.releaseHold(holdId);
            } catch (RuntimeException exception) {
                log.warn(
                        "Failed to release hold after booking expiration: bookingId={}, holdId={}",
                        bookingId,
                        holdId,
                        exception
                );
            }
        }
        if (orderCode == null || orderCode.isBlank()) {
            return;
        }
        try {
            payOsClient.cancelPaymentLink(orderCode, "EXPIRED");
        } catch (RuntimeException exception) {
            log.warn(
                    "Failed to cancel PayOS session after booking expiration: bookingId={}, orderCode={}",
                    bookingId,
                    orderCode,
                    exception
            );
        }
    }

    private void runAfterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }
}
