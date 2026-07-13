package com.asms.payment.service.impl;

import com.asms.booking.entity.Booking;
import com.asms.booking.entity.BookingItem;
import com.asms.booking.dto.TicketHoldDtos.TicketHoldInfo;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.repository.BookingRepository;
import com.asms.booking.service.RedisTicketHoldService;
import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.repository.ShowScheduleRepository;
import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.NotFoundException;
import com.asms.core.exception.UnauthorizedException;
import com.asms.identity.entity.User;
import com.asms.identity.enums.UserRole;
import com.asms.payment.dto.CreatePaymentRequest;
import com.asms.payment.dto.CreatePaymentResponse;
import com.asms.payment.dto.PayOsCallbackRequest;
import com.asms.payment.dto.PaymentCallbackResponse;
import com.asms.payment.dto.PaymentReconcileRequest;
import com.asms.payment.dto.PaymentReconcileResponse;
import com.asms.payment.entity.Payment;
import com.asms.payment.enums.PaymentStatus;
import com.asms.payment.integration.PayOsClient;
import com.asms.payment.integration.PayOsPaymentLink;
import com.asms.payment.integration.PayOsPaymentStatus;
import com.asms.payment.messaging.PaymentCompletedMessage;
import com.asms.payment.messaging.PaymentCompletedPublisher;
import com.asms.payment.repository.PaymentRepository;
import com.asms.payment.service.PaymentService;
import com.asms.ticketing.service.TicketGenerationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);
    private static final Duration AUTOMATIC_RECONCILIATION_LOOKBACK = Duration.ofHours(48);

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final PayOsClient payOsClient;
    private final TicketGenerationService ticketGenerationService;
    private final PaymentCompletedPublisher paymentCompletedPublisher;
    private final RedisTicketHoldService redisTicketHoldService;
    private final ShowScheduleRepository showScheduleRepository;

    public PaymentServiceImpl(
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            PayOsClient payOsClient,
            TicketGenerationService ticketGenerationService,
            PaymentCompletedPublisher paymentCompletedPublisher,
            RedisTicketHoldService redisTicketHoldService,
            ShowScheduleRepository showScheduleRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.payOsClient = payOsClient;
        this.ticketGenerationService = ticketGenerationService;
        this.paymentCompletedPublisher = paymentCompletedPublisher;
        this.redisTicketHoldService = redisTicketHoldService;
        this.showScheduleRepository = showScheduleRepository;
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
        String orderCode = request == null ? null : request.resolvedOrderCode();
        boolean signaturePresent = request != null && request.signature() != null && !request.signature().isBlank();
        log.info(
                "PayOS callback received orderCode={} signaturePresent={}",
                orderCode,
                signaturePresent
        );

        boolean validSignature = payOsClient.isValidCallback(request);
        log.info("PayOS callback signature validation orderCode={} valid={}", orderCode, validSignature);
        if (!validSignature) {
            throw new BadRequestException("Invalid PayOS callback signature");
        }

        if (orderCode == null || orderCode.isBlank()) {
            throw new BadRequestException("Missing PayOS order code");
        }
        String callbackStatus = request.resolvedStatus();
        BigDecimal callbackAmount = request.resolvedAmount();
        log.info(
                "PayOS callback verified orderCode={} status={} amount={}",
                orderCode,
                callbackStatus,
                callbackAmount
        );

        if (isPayOsWebhookVerificationSample(request, orderCode)) {
            log.info("PayOS webhook verification sample accepted orderCode={} amount={}", orderCode, callbackAmount);
            return new PaymentCallbackResponse(null, orderCode, PaymentStatus.SUCCESS, null, 0);
        }

        Payment payment = paymentRepository.findByPayosOrderCodeForUpdate(orderCode)
                .orElseThrow(() -> new NotFoundException("Payment not found"));
        log.info(
                "PayOS callback payment found orderCode={} paymentId={} bookingId={}",
                orderCode,
                payment.getId(),
                payment.getBooking().getId()
        );
        PaymentStatus incomingStatus = parseStatus(callbackStatus);
        PayOsPaymentStatus providerStatus = new PayOsPaymentStatus(
                orderCode,
                callbackStatus,
                incomingStatus,
                request.resolvedTransactionId(),
                incomingStatus == PaymentStatus.SUCCESS ? Instant.now() : null,
                callbackAmount
        );
        AppliedPaymentStatus applied = applyProviderPaymentStatus(payment, providerStatus, "CALLBACK");
        log.info(
                "PayOS callback processed orderCode={} paymentId={} bookingId={} ticketsGenerated={}",
                orderCode,
                payment.getId(),
                payment.getBooking().getId(),
                applied.generatedTickets()
        );

        return new PaymentCallbackResponse(
                payment.getBooking().getId(),
                payment.getPayosOrderCode(),
                payment.getStatus(),
                payment.getBooking().getStatus(),
                applied.generatedTickets()
        );
    }

    @Override
    @Transactional
    public PaymentReconcileResponse reconcilePayment(PaymentReconcileRequest request, User user) {
        Payment payment = paymentRepository.findByBookingIdForUpdate(request.bookingId())
                .orElseThrow(() -> new NotFoundException("Payment not found"));
        verifyReconciliationAccess(payment, user);

        PayOsPaymentStatus providerStatus = payOsClient.getPaymentStatus(providerLookupId(payment));
        AppliedPaymentStatus applied = applyProviderPaymentStatus(payment, providerStatus, "MANUAL");
        return toReconcileResponse(payment, providerStatus, applied.changed());
    }

    @Override
    @Transactional
    public void reconcilePendingPayments() {
        Instant createdAfter = Instant.now().minus(AUTOMATIC_RECONCILIATION_LOOKBACK);
        for (Payment candidate : paymentRepository.findTop100ByStatusAndCreatedAtAfterOrderByCreatedAtAsc(PaymentStatus.PENDING, createdAfter)) {
            try {
                Payment payment = paymentRepository.findByIdForUpdate(candidate.getId()).orElse(null);
                if (payment == null || payment.getStatus() != PaymentStatus.PENDING) {
                    continue;
                }
                PaymentStatus oldStatus = payment.getStatus();
                PayOsPaymentStatus providerStatus = payOsClient.getPaymentStatus(providerLookupId(payment));
                AppliedPaymentStatus applied = applyProviderPaymentStatus(payment, providerStatus, "AUTOMATIC");
                log.info(
                        "PayOS reconciliation paymentId={} bookingId={} orderCode={} oldStatus={} providerStatus={} newStatus={} changed={}",
                        payment.getId(),
                        payment.getBooking().getId(),
                        payment.getPayosOrderCode(),
                        oldStatus,
                        providerStatus.providerStatus(),
                        payment.getStatus(),
                        applied.changed()
                );
            } catch (Exception exception) {
                log.warn(
                        "PayOS reconciliation failed paymentId={} bookingId={} orderCode={}",
                        candidate.getId(),
                        candidate.getBooking().getId(),
                        candidate.getPayosOrderCode(),
                        exception
                );
            }
        }
    }

    private AppliedPaymentStatus applyProviderPaymentStatus(
            Payment payment,
            PayOsPaymentStatus providerStatus,
            String source
    ) {
        Booking booking = payment.getBooking();
        PaymentStatus oldPaymentStatus = payment.getStatus();
        BookingStatus oldBookingStatus = booking.getStatus();
        PaymentStatus incomingStatus = providerStatus.paymentStatus();

        if (oldPaymentStatus == PaymentStatus.SUCCESS && incomingStatus != PaymentStatus.SUCCESS) {
            return new AppliedPaymentStatus(false, 0);
        }
        if (incomingStatus == PaymentStatus.SUCCESS) {
            if (providerStatus.amount() == null) {
                throw new BadRequestException("PayOS paid amount is required");
            }
            if (providerStatus.amount().compareTo(payment.getAmount()) != 0) {
                throw new BadRequestException("PayOS paid amount does not match the booking amount");
            }
        }

        if (providerStatus.transactionId() != null && !providerStatus.transactionId().isBlank()) {
            payment.setTransactionId(providerStatus.transactionId());
        }

        int generatedTickets = 0;
        if (incomingStatus == PaymentStatus.SUCCESS) {
            boolean firstSuccessfulTransition =
                    oldPaymentStatus != PaymentStatus.SUCCESS || oldBookingStatus != BookingStatus.PAID;
            if (firstSuccessfulTransition) {
                commitHeldInventory(booking);
            }
            payment.setStatus(PaymentStatus.SUCCESS);
            if (payment.getPaidAt() == null) {
                payment.setPaidAt(providerStatus.paidAt() == null ? Instant.now() : providerStatus.paidAt());
            }
            booking.setStatus(BookingStatus.PAID);
            bookingRepository.save(booking);
            paymentRepository.save(payment);
            if (firstSuccessfulTransition) {
                generatedTickets = ticketGenerationService.generateTicketsIfMissing(booking).size();
                completePaymentAfterCommit(payment, booking);
            }
        } else if (incomingStatus == PaymentStatus.EXPIRED && oldPaymentStatus == PaymentStatus.PENDING) {
            payment.setStatus(PaymentStatus.EXPIRED);
            booking.setStatus(BookingStatus.EXPIRED);
            releaseHoldsAfterCommit(booking);
            bookingRepository.save(booking);
            paymentRepository.save(payment);
        } else if (incomingStatus == PaymentStatus.FAILED && oldPaymentStatus == PaymentStatus.PENDING) {
            payment.setStatus(PaymentStatus.FAILED);
            booking.setStatus(BookingStatus.FAILED);
            releaseHoldsAfterCommit(booking);
            bookingRepository.save(booking);
            paymentRepository.save(payment);
        } else if (incomingStatus == PaymentStatus.PENDING) {
            paymentRepository.save(payment);
        }

        boolean changed = oldPaymentStatus != payment.getStatus() || oldBookingStatus != booking.getStatus();
        log.info(
                "Applied provider payment status source={} paymentId={} bookingId={} orderCode={} oldPaymentStatus={} providerStatus={} newPaymentStatus={} newBookingStatus={}",
                source,
                payment.getId(),
                booking.getId(),
                payment.getPayosOrderCode(),
                oldPaymentStatus,
                providerStatus.providerStatus(),
                payment.getStatus(),
                booking.getStatus()
        );
        return new AppliedPaymentStatus(changed, generatedTickets);
    }

    private void commitHeldInventory(Booking booking) {
        for (BookingItem item : booking.getItems()) {
            TicketHoldInfo hold = redisTicketHoldService.getHold(item.getHoldId()).orElse(null);
            if (hold == null || !hold.expiresAt().isAfter(Instant.now())) {
                throw new BadRequestException("A ticket hold has expired. Please select the tickets again.");
            }
            boolean matchesItem = item.getHoldId().equals(hold.holdId())
                    && item.getScheduleId().equals(hold.scheduleId())
                    && item.getTicketType().name().equals(hold.ticketType())
                    && item.getQuantity() == hold.quantity()
                    && booking.getUser().getId().equals(hold.userId());
            if (!matchesItem) {
                throw new BadRequestException("A ticket hold does not match the booking item");
            }
        }

        List<UUID> scheduleIds = booking.getItems().stream()
                .map(BookingItem::getScheduleId)
                .map(this::parseScheduleId)
                .distinct()
                .sorted(Comparator.naturalOrder())
                .toList();
        List<ShowSchedule> schedules = showScheduleRepository.findAllByIdForUpdate(scheduleIds);
        if (schedules.size() != scheduleIds.size()) {
            throw new BadRequestException("One or more show schedules no longer exist");
        }
        Map<UUID, ShowSchedule> scheduleById = new HashMap<>();
        schedules.forEach(schedule -> scheduleById.put(schedule.getId(), schedule));

        for (BookingItem item : booking.getItems()) {
            ShowSchedule schedule = scheduleById.get(parseScheduleId(item.getScheduleId()));
            if (schedule == null) {
                throw new BadRequestException("One or more show schedules no longer exist");
            }
            schedule.decrementAvailable(item.getTicketType(), item.getQuantity());
        }
        showScheduleRepository.saveAll(schedules);
    }

    private UUID parseScheduleId(String scheduleId) {
        try {
            return UUID.fromString(scheduleId);
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Invalid show schedule in booking");
        }
    }

    private void completePaymentAfterCommit(Payment payment, Booking booking) {
        PaymentCompletedMessage message = new PaymentCompletedMessage(
                payment.getBooking().getId(),
                payment.getId(),
                payment.getPayosOrderCode(),
                payment.getPaidAt()
        );

        runAfterCommit(() -> {
            releaseHolds(booking);
            paymentCompletedPublisher.publish(message);
        });
    }

    private void releaseHoldsAfterCommit(Booking booking) {
        runAfterCommit(() -> releaseHolds(booking));
    }

    private void releaseHolds(Booking booking) {
        booking.getItems().stream()
                .map(BookingItem::getHoldId)
                .filter(holdId -> holdId != null && !holdId.isBlank())
                .distinct()
                .forEach(redisTicketHoldService::releaseHold);
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

    private String providerLookupId(Payment payment) {
        return hasText(payment.getPaymentLinkId()) ? payment.getPaymentLinkId() : payment.getPayosOrderCode();
    }

    private void verifyReconciliationAccess(Payment payment, User user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication required");
        }
        boolean elevated = user.getRole() == UserRole.MANAGER || user.getRole() == UserRole.ADMIN;
        boolean owner = payment.getBooking().getUser().getId().equals(user.getId());
        if (!elevated && !owner) {
            throw new UnauthorizedException("You cannot reconcile this payment");
        }
    }

    private PaymentReconcileResponse toReconcileResponse(
            Payment payment,
            PayOsPaymentStatus providerStatus,
            boolean changed
    ) {
        String message = switch (payment.getStatus()) {
            case SUCCESS -> "Payment confirmed. Your booking is paid.";
            case FAILED -> "Payment failed on PayOS.";
            case EXPIRED -> "Payment expired on PayOS.";
            case PENDING -> "Payment is still pending on PayOS. Please wait a moment.";
        };
        return new PaymentReconcileResponse(
                payment.getBooking().getId(),
                payment.getId(),
                payment.getPayosOrderCode(),
                providerStatus.providerStatus(),
                payment.getStatus(),
                payment.getBooking().getStatus(),
                payment.getPaidAt(),
                changed,
                message
        );
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
        if (rawStatus == null || rawStatus.isBlank()) {
            return PaymentStatus.PENDING;
        }
        String normalizedStatus = rawStatus.trim().toUpperCase(Locale.ROOT);
        if ("PAID".equals(normalizedStatus) || "SUCCESSFUL".equals(normalizedStatus)) {
            return PaymentStatus.SUCCESS;
        }
        if ("CANCELLED".equals(normalizedStatus) || "CANCELED".equals(normalizedStatus)) {
            return PaymentStatus.FAILED;
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

    private record AppliedPaymentStatus(boolean changed, int generatedTickets) {
    }
}
