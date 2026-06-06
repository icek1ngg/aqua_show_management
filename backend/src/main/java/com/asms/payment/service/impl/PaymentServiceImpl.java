package com.asms.payment.service.impl;

import com.asms.booking.entity.Booking;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.repository.BookingRepository;
import com.asms.booking.service.RedisTicketHoldService;
import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.NotFoundException;
import com.asms.identity.entity.User;
import com.asms.payment.dto.CreatePaymentRequest;
import com.asms.payment.dto.CreatePaymentResponse;
import com.asms.payment.dto.PayOsCallbackRequest;
import com.asms.payment.dto.PaymentCallbackResponse;
import com.asms.payment.entity.Payment;
import com.asms.payment.enums.PaymentStatus;
import com.asms.payment.integration.PayOsClient;
import com.asms.payment.integration.PayOsPaymentLink;
import com.asms.payment.messaging.PaymentCompletedMessage;
import com.asms.payment.messaging.PaymentCompletedPublisher;
import com.asms.payment.repository.PaymentRepository;
import com.asms.payment.service.PaymentService;
import com.asms.ticketing.service.TicketGenerationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final PayOsClient payOsClient;
    private final TicketGenerationService ticketGenerationService;
    private final PaymentCompletedPublisher paymentCompletedPublisher;
    private final RedisTicketHoldService redisTicketHoldService;

    public PaymentServiceImpl(
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            PayOsClient payOsClient,
            TicketGenerationService ticketGenerationService,
            PaymentCompletedPublisher paymentCompletedPublisher,
            RedisTicketHoldService redisTicketHoldService
    ) {
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.payOsClient = payOsClient;
        this.ticketGenerationService = ticketGenerationService;
        this.paymentCompletedPublisher = paymentCompletedPublisher;
        this.redisTicketHoldService = redisTicketHoldService;
    }

    @Override
    @Transactional
    public CreatePaymentResponse createPayment(CreatePaymentRequest request, User user) {
        Booking booking = bookingRepository.findByIdAndUser(request.bookingId(), user)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        if (booking.getStatus() == BookingStatus.EXPIRED) {
            throw new BadRequestException("Expired bookings cannot be paid");
        }

        if (booking.getExpiresAt().isBefore(Instant.now()) && booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
            booking.setStatus(BookingStatus.EXPIRED);
            bookingRepository.save(booking);
            throw new BadRequestException("Booking payment window has expired");
        }

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new BadRequestException("Only pending bookings can create payment links");
        }

        Payment payment = paymentRepository.findByBooking_Id(booking.getId())
                .orElseGet(() -> createNewPendingPayment(booking));

        payment = refreshPendingPaymentSessionIfMissing(payment);

        return toCreatePaymentResponse(payment);
    }

    @Override
    @Transactional
    public PaymentCallbackResponse processCallback(PayOsCallbackRequest request) {
        if (!payOsClient.isValidCallback(request)) {
            throw new BadRequestException("Invalid PayOS callback signature");
        }

        String orderCode = request.resolvedOrderCode();
        if (orderCode == null || orderCode.isBlank()) {
            throw new BadRequestException("Missing PayOS order code");
        }

        if (isPayOsWebhookVerificationSample(request, orderCode)) {
            return new PaymentCallbackResponse(null, orderCode, PaymentStatus.SUCCESS, null, 0);
        }

        Payment payment = paymentRepository.findByPayosOrderCode(orderCode)
                .orElseThrow(() -> new NotFoundException("Payment not found"));
        Booking booking = payment.getBooking();
        PaymentStatus incomingStatus = parseStatus(request.resolvedStatus());

        if (incomingStatus == PaymentStatus.SUCCESS) {
            boolean shouldPublishPaymentCompleted = payment.getStatus() != PaymentStatus.SUCCESS || booking.getStatus() != BookingStatus.PAID;
            int generatedTickets = markPaymentSuccessful(payment, booking, request.resolvedTransactionId());
            if (shouldPublishPaymentCompleted) {
                publishPaymentCompletedAfterCommit(payment);
            }
            return new PaymentCallbackResponse(booking.getId(), payment.getPayosOrderCode(), payment.getStatus(), booking.getStatus(), generatedTickets);
        }

        payment.setTransactionId(request.resolvedTransactionId());
        payment.setStatus(incomingStatus);

        if (incomingStatus == PaymentStatus.EXPIRED) {
            booking.setStatus(BookingStatus.EXPIRED);
            releaseHoldIfPresent(booking);
            bookingRepository.save(booking);
            paymentRepository.save(payment);
        } else if (incomingStatus == PaymentStatus.FAILED) {
            booking.setStatus(BookingStatus.FAILED);
            releaseHoldIfPresent(booking);
            bookingRepository.save(booking);
            paymentRepository.save(payment);
        } else {
            paymentRepository.save(payment);
        }

        return new PaymentCallbackResponse(booking.getId(), payment.getPayosOrderCode(), payment.getStatus(), booking.getStatus(), 0);
    }

    private int markPaymentSuccessful(Payment payment, Booking booking, String transactionId) {
        payment.setTransactionId(transactionId);
        payment.setStatus(PaymentStatus.SUCCESS);
        if (payment.getPaidAt() == null) {
            payment.setPaidAt(Instant.now());
        }

        if (booking.getStatus() != BookingStatus.PAID) {
            booking.setStatus(BookingStatus.PAID);
        }

        bookingRepository.save(booking);
        paymentRepository.save(payment);
        releaseHoldIfPresent(booking);

        return ticketGenerationService.generateTicketsIfMissing(booking).size();
    }

    private void releaseHoldIfPresent(Booking booking) {
        String holdId = booking.getHoldId();
        if (holdId == null || holdId.isBlank()) {
            return;
        }
        redisTicketHoldService.releaseHold(holdId);
    }

    private void publishPaymentCompletedAfterCommit(Payment payment) {
        PaymentCompletedMessage message = new PaymentCompletedMessage(
                payment.getBooking().getId(),
                payment.getId(),
                payment.getPayosOrderCode(),
                payment.getPaidAt()
        );

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            paymentCompletedPublisher.publish(message);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                paymentCompletedPublisher.publish(message);
            }
        });
    }

    private Payment createNewPendingPayment(Booking booking) {
        String payosOrderCode = generateOrderCode(booking.getId());
        PayOsPaymentLink payOsPaymentLink = payOsClient.createPaymentLink(booking, payosOrderCode);
        Payment payment = new Payment(booking, payosOrderCode, booking.getTotalAmount(), payOsPaymentLink.checkoutUrl());
        applyPayOsPaymentLink(payment, payOsPaymentLink);
        return paymentRepository.save(payment);
    }

    private Payment refreshPendingPaymentSessionIfMissing(Payment payment) {
        if (payment.getStatus() != PaymentStatus.PENDING || hasProviderPaymentSession(payment)) {
            return payment;
        }

        PayOsPaymentLink payOsPaymentLink = payOsClient.createPaymentLink(payment.getBooking(), payment.getPayosOrderCode());
        applyPayOsPaymentLink(payment, payOsPaymentLink);
        return paymentRepository.save(payment);
    }

    private boolean hasProviderPaymentSession(Payment payment) {
        return hasText(payment.getQrCode())
                || hasText(payment.getPaymentLinkId())
                || (hasText(payment.getBankBin()) && hasText(payment.getAccountNumber()));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private void applyPayOsPaymentLink(Payment payment, PayOsPaymentLink payOsPaymentLink) {
        payment.setPaymentLink(payOsPaymentLink.checkoutUrl());
        payment.setQrCode(payOsPaymentLink.qrCode());
        payment.setPaymentLinkId(payOsPaymentLink.paymentLinkId());
        payment.setBankBin(payOsPaymentLink.bin());
        payment.setAccountNumber(payOsPaymentLink.accountNumber());
        payment.setAccountName(payOsPaymentLink.accountName());
        payment.setPaymentDescription(payOsPaymentLink.description());
    }

    private String generateOrderCode(UUID bookingId) {
        long base = Instant.now().toEpochMilli() % 900_000_000_000L;
        long suffix = ThreadLocalRandom.current().nextLong(100, 999);
        return String.valueOf((base * 1000) + suffix);
    }

    private CreatePaymentResponse toCreatePaymentResponse(Payment payment) {
        long expiresInSeconds = Math.max(0, Duration.between(Instant.now(), payment.getBooking().getExpiresAt()).toSeconds());
        return new CreatePaymentResponse(
                payment.getBooking().getId(),
                payment.getId(),
                payment.getPayosOrderCode(),
                payment.getPaymentLink(),
                payment.getPaymentLink(),
                payment.getQrCode(),
                payment.getPaymentLinkId(),
                payment.getBankBin(),
                payment.getAccountNumber(),
                payment.getAccountName(),
                payment.getAmount(),
                payment.getPaymentDescription(),
                payment.getStatus(),
                expiresInSeconds
        );
    }

    private PaymentStatus parseStatus(String rawStatus) {
        String normalizedStatus = rawStatus.trim().toUpperCase(Locale.ROOT);
        if ("PAID".equals(normalizedStatus) || "SUCCESSFUL".equals(normalizedStatus)) {
            return PaymentStatus.SUCCESS;
        }
        return PaymentStatus.valueOf(normalizedStatus);
    }

    private boolean isPayOsWebhookVerificationSample(PayOsCallbackRequest request, String orderCode) {
        if (request.data() == null) {
            return false;
        }

        Object description = request.data().get("description");
        return "123".equals(orderCode)
                && BigDecimal.valueOf(3000).compareTo(request.resolvedAmount()) == 0
                && "VQRIO123".equals(String.valueOf(description));
    }
}
