package com.asms.payment;

import com.asms.booking.entity.Booking;
import com.asms.booking.entity.BookingItem;
import com.asms.booking.dto.TicketHoldDtos.TicketHoldInfo;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.enums.TicketType;
import com.asms.booking.exception.TicketHoldServiceUnavailableException;
import com.asms.booking.repository.BookingRepository;
import com.asms.booking.service.RedisTicketHoldService;
import com.asms.catalog.entity.Show;
import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.entity.Venue;
import com.asms.catalog.repository.ShowScheduleRepository;
import com.asms.identity.entity.User;
import com.asms.payment.dto.CreatePaymentRequest;
import com.asms.payment.dto.PayOsCallbackRequest;
import com.asms.payment.dto.PaymentReconcileRequest;
import com.asms.payment.entity.Payment;
import com.asms.payment.enums.PaymentStatus;
import com.asms.payment.enums.PaymentReconciliationReason;
import com.asms.payment.integration.PayOsClient;
import com.asms.payment.integration.PayOsPaymentLink;
import com.asms.payment.integration.PayOsPaymentStatus;
import com.asms.payment.messaging.PaymentCompletedPublisher;
import com.asms.payment.repository.PaymentRepository;
import com.asms.payment.service.impl.PaymentServiceImpl;
import com.asms.ticketing.entity.Ticket;
import com.asms.ticketing.service.TicketGenerationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Comparator;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PaymentServiceImplTest {

    private BookingRepository bookingRepository;
    private PaymentRepository paymentRepository;
    private PayOsClient payOsClient;
    private TicketGenerationService ticketGenerationService;
    private PaymentCompletedPublisher paymentCompletedPublisher;
    private RedisTicketHoldService redisTicketHoldService;
    private ShowScheduleRepository showScheduleRepository;
    private PaymentServiceImpl paymentService;

    @BeforeEach
    void setUp() {
        bookingRepository = mock(BookingRepository.class);
        paymentRepository = mock(PaymentRepository.class);
        payOsClient = mock(PayOsClient.class);
        ticketGenerationService = mock(TicketGenerationService.class);
        paymentCompletedPublisher = mock(PaymentCompletedPublisher.class);
        redisTicketHoldService = mock(RedisTicketHoldService.class);
        showScheduleRepository = mock(ShowScheduleRepository.class);
        when(ticketGenerationService.generateTicketsIfMissing(any())).thenReturn(List.of(mock(Ticket.class)));

        paymentService = new PaymentServiceImpl(
                bookingRepository,
                paymentRepository,
                payOsClient,
                ticketGenerationService,
                paymentCompletedPublisher,
                redisTicketHoldService,
                showScheduleRepository
        );
    }

    @Test
    void callbackSuccessUpdatesBookingAndPublishesOnce() {
        Payment payment = pendingPayment();
        when(payOsClient.isValidCallback(any())).thenReturn(true);
        when(paymentRepository.findByPayosOrderCodeForUpdate(payment.getPayosOrderCode())).thenReturn(Optional.of(payment));

        paymentService.processCallback(successCallback(payment.getPayosOrderCode()));

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(payment.getBooking().getStatus()).isEqualTo(BookingStatus.PAID);
        assertThat(payment.getPaidAt()).isNotNull();
        verify(ticketGenerationService).generateTicketsIfMissing(payment.getBooking());
        verify(paymentCompletedPublisher).publish(any());
    }

    @Test
    void duplicateCallbackRepublishesIdempotentCompletionTaskForRecovery() {
        Payment payment = pendingPayment();
        when(payOsClient.isValidCallback(any())).thenReturn(true);
        when(paymentRepository.findByPayosOrderCodeForUpdate(payment.getPayosOrderCode())).thenReturn(Optional.of(payment));

        paymentService.processCallback(successCallback(payment.getPayosOrderCode()));
        paymentService.processCallback(successCallback(payment.getPayosOrderCode()));

        verify(paymentCompletedPublisher, times(2)).publish(any());
        verify(ticketGenerationService, times(1)).generateTicketsIfMissing(payment.getBooking());
    }

    @Test
    void firstSuccessfulCallbackCommitsEveryBookingItemExactlyOnce() {
        Show show = new Show("Ocean Dreams", "Water show", "image.jpg", 45);
        Venue venue = new Venue("Main Pool", "Central lagoon", 500);
        LocalDateTime start = LocalDateTime.now().plusDays(2);
        ShowSchedule standardSchedule = new ShowSchedule(
                show, venue, start, start.plusMinutes(45), 10, 0, 0, new BigDecimal("2500")
        );
        ShowSchedule vipSchedule = new ShowSchedule(
                show, venue, start.plusDays(1), start.plusDays(1).plusMinutes(45), 0, 5, 0, new BigDecimal("2500")
        );
        Booking booking = Booking.create(new User("Test", "User", "multi@example.com", "0900000001", "hash"),
                "AQB-MULTI", Instant.now().plusSeconds(900));
        setId(booking, UUID.randomUUID());
        booking.addItem(BookingItem.create(booking, standardSchedule, TicketType.STANDARD, 2,
                new BigDecimal("2500"), "hold-standard"));
        booking.addItem(BookingItem.create(booking, vipSchedule, TicketType.VIP, 1,
                new BigDecimal("6250"), "hold-vip"));
        Payment payment = new Payment(booking, "987654321", booking.getTotalAmount(), "https://pay.payos.vn/multi");

        when(payOsClient.isValidCallback(any())).thenReturn(true);
        when(paymentRepository.findByPayosOrderCodeForUpdate(payment.getPayosOrderCode())).thenReturn(Optional.of(payment));
        List<UUID> lockedIds = List.of(standardSchedule.getId(), vipSchedule.getId()).stream()
                .sorted(Comparator.naturalOrder())
                .toList();
        when(showScheduleRepository.findAllByIdForUpdate(lockedIds))
                .thenReturn(List.of(standardSchedule, vipSchedule));
        when(redisTicketHoldService.getHold("hold-standard")).thenReturn(Optional.of(validHold(booking, booking.getItems().get(0))));
        when(redisTicketHoldService.getHold("hold-vip")).thenReturn(Optional.of(validHold(booking, booking.getItems().get(1))));
        when(ticketGenerationService.generateTicketsIfMissing(booking))
                .thenReturn(List.of(mock(Ticket.class), mock(Ticket.class), mock(Ticket.class)));

        paymentService.processCallback(successCallback(payment.getPayosOrderCode(), booking.getTotalAmount()));
        paymentService.processCallback(successCallback(payment.getPayosOrderCode(), booking.getTotalAmount()));

        assertThat(standardSchedule.availableFor(TicketType.STANDARD)).isEqualTo(8);
        assertThat(vipSchedule.availableFor(TicketType.VIP)).isEqualTo(4);
        verify(showScheduleRepository, times(1))
                .findAllByIdForUpdate(lockedIds);
        verify(redisTicketHoldService, times(2)).releaseHold("hold-standard");
        verify(redisTicketHoldService, times(2)).releaseHold("hold-vip");
        verify(ticketGenerationService, times(1)).generateTicketsIfMissing(booking);
        verify(paymentCompletedPublisher, times(2)).publish(any());
    }

    @Test
    void expiredHoldStillHonorsCapturedPayment() {
        Payment payment = pendingPayment();
        when(payOsClient.isValidCallback(any())).thenReturn(true);
        when(paymentRepository.findByPayosOrderCodeForUpdate(payment.getPayosOrderCode())).thenReturn(Optional.of(payment));
        when(redisTicketHoldService.getHold("hold-test")).thenReturn(Optional.empty());
        paymentService.processCallback(successCallback(payment.getPayosOrderCode()));

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(payment.getBooking().getStatus()).isEqualTo(BookingStatus.PAID);
        verify(showScheduleRepository).saveAll(any());
        verify(ticketGenerationService).generateTicketsIfMissing(payment.getBooking());
        verify(paymentCompletedPublisher).publish(any());
    }

    @Test
    void capturedPaymentWithInventoryShortfallWaitsForReconciliation() {
        CapturedInventoryFixture fixture = capturedInventoryFixture(0);

        paymentService.processCallback(successCallback(
                fixture.payment().getPayosOrderCode(), fixture.payment().getAmount()));

        assertThat(fixture.payment().getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(fixture.payment().getBooking().getStatus()).isEqualTo(BookingStatus.PROCESSING);
        assertThat(fixture.payment().getReconciliationReason())
                .isEqualTo(PaymentReconciliationReason.CAPTURED_PAYMENT_INVENTORY_SHORTFALL);
        assertThat(fixture.payment().getInventoryCommittedAt()).isNull();
        assertThat(fixture.schedule().availableFor(TicketType.STANDARD)).isZero();
        verify(ticketGenerationService, never()).generateTicketsIfMissing(any());
        verify(paymentCompletedPublisher, never()).publish(any());
    }

    @Test
    void inventoryShortfallDoesNotPartiallyCommitOtherSchedules() {
        User user = new User("Atomic", "Inventory", "atomic@example.com", "0900000010", "hash");
        Show show = new Show("Atomic Show", "Water show", null, 45);
        Venue venue = new Venue("Atomic Pool", "Central lagoon", 100);
        LocalDateTime start = LocalDateTime.now().plusDays(1);
        ShowSchedule availableSchedule = new ShowSchedule(
                show, venue, start, start.plusMinutes(45), 2, 0, 0, new BigDecimal("100000"));
        ShowSchedule exhaustedSchedule = new ShowSchedule(
                show, venue, start.plusDays(1), start.plusDays(1).plusMinutes(45), 0, 0, 0,
                new BigDecimal("100000"));
        Booking booking = Booking.create(user, "AQB-ATOMIC", Instant.now().plusSeconds(900));
        setId(booking, UUID.randomUUID());
        booking.addItem(BookingItem.create(
                booking, availableSchedule, TicketType.STANDARD, 1, new BigDecimal("100000"), "hold-a"));
        booking.addItem(BookingItem.create(
                booking, exhaustedSchedule, TicketType.STANDARD, 1, new BigDecimal("100000"), "hold-b"));
        Payment payment = new Payment(booking, "987650002", booking.getTotalAmount(), "https://pay.payos.vn/atomic");

        when(payOsClient.isValidCallback(any())).thenReturn(true);
        when(paymentRepository.findByPayosOrderCodeForUpdate(payment.getPayosOrderCode()))
                .thenReturn(Optional.of(payment));
        when(redisTicketHoldService.getHold("hold-a")).thenReturn(Optional.empty());
        when(redisTicketHoldService.getHold("hold-b")).thenReturn(Optional.empty());
        List<UUID> scheduleIds = List.of(availableSchedule.getId(), exhaustedSchedule.getId()).stream()
                .sorted(Comparator.naturalOrder())
                .toList();
        when(showScheduleRepository.findAllByIdForUpdate(scheduleIds))
                .thenReturn(List.of(availableSchedule, exhaustedSchedule));

        paymentService.processCallback(successCallback(payment.getPayosOrderCode(), booking.getTotalAmount()));

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(booking.getStatus()).isEqualTo(BookingStatus.PROCESSING);
        assertThat(availableSchedule.availableFor(TicketType.STANDARD)).isEqualTo(2);
        assertThat(exhaustedSchedule.availableFor(TicketType.STANDARD)).isZero();
        verify(showScheduleRepository, never()).saveAll(any());
        verify(ticketGenerationService, never()).generateTicketsIfMissing(any());
    }

    @Test
    void capturedPaymentCompletesWhenInventoryIsRestored() {
        CapturedInventoryFixture fixture = capturedInventoryFixture(0);
        PayOsCallbackRequest callback = successCallback(
                fixture.payment().getPayosOrderCode(), fixture.payment().getAmount());

        paymentService.processCallback(callback);
        fixture.schedule().setStandardAvailableTickets(1);
        paymentService.processCallback(callback);

        assertThat(fixture.payment().getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(fixture.payment().getBooking().getStatus()).isEqualTo(BookingStatus.PAID);
        assertThat(fixture.payment().getReconciliationReason()).isNull();
        assertThat(fixture.payment().getInventoryCommittedAt()).isNotNull();
        assertThat(fixture.schedule().availableFor(TicketType.STANDARD)).isZero();
        verify(ticketGenerationService).generateTicketsIfMissing(fixture.payment().getBooking());
        verify(paymentCompletedPublisher).publish(any());
    }

    @Test
    void automaticReconciliationCompletesCapturedPaymentAfterCapacityRecovery() {
        CapturedInventoryFixture fixture = capturedInventoryFixture(0);
        paymentService.processCallback(successCallback(
                fixture.payment().getPayosOrderCode(), fixture.payment().getAmount()));
        fixture.schedule().setStandardAvailableTickets(1);
        when(paymentRepository.findTop100ByStatusAndBooking_StatusOrderByCreatedAtAsc(
                PaymentStatus.SUCCESS, BookingStatus.PROCESSING))
                .thenReturn(List.of(fixture.payment()));
        when(paymentRepository.findByIdForUpdate(fixture.payment().getId()))
                .thenReturn(Optional.of(fixture.payment()));

        paymentService.reconcileCapturedInventory();

        assertThat(fixture.payment().getBooking().getStatus()).isEqualTo(BookingStatus.PAID);
        assertThat(fixture.payment().getInventoryCommittedAt()).isNotNull();
        assertThat(fixture.schedule().availableFor(TicketType.STANDARD)).isZero();
        verify(ticketGenerationService).generateTicketsIfMissing(fixture.payment().getBooking());
    }

    @Test
    void redisReleaseFailureDoesNotSuppressCompletionPublication() {
        Payment payment = pendingPayment();
        when(payOsClient.isValidCallback(any())).thenReturn(true);
        when(paymentRepository.findByPayosOrderCodeForUpdate(payment.getPayosOrderCode())).thenReturn(Optional.of(payment));
        org.mockito.Mockito.doThrow(new IllegalStateException("redis unavailable"))
                .when(redisTicketHoldService).releaseHold("hold-test");

        paymentService.processCallback(successCallback(payment.getPayosOrderCode()));

        verify(paymentCompletedPublisher).publish(any());
    }

    @Test
    void redisLookupFailureDoesNotBlockCapturedPayment() {
        Payment payment = pendingPayment();
        when(payOsClient.isValidCallback(any())).thenReturn(true);
        when(paymentRepository.findByPayosOrderCodeForUpdate(payment.getPayosOrderCode())).thenReturn(Optional.of(payment));
        when(redisTicketHoldService.getHold("hold-test"))
                .thenThrow(new TicketHoldServiceUnavailableException("redis unavailable"));

        paymentService.processCallback(successCallback(payment.getPayosOrderCode()));

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(payment.getBooking().getStatus()).isEqualTo(BookingStatus.PAID);
        verify(paymentCompletedPublisher).publish(any());
    }

    @Test
    void capturedPaymentWithMismatchedHoldMovesToReconciliation() {
        Payment payment = pendingPayment();
        BookingItem item = payment.getBooking().getItems().getFirst();
        when(payOsClient.isValidCallback(any())).thenReturn(true);
        when(paymentRepository.findByPayosOrderCodeForUpdate(payment.getPayosOrderCode())).thenReturn(Optional.of(payment));
        when(redisTicketHoldService.getHold(item.getHoldId())).thenReturn(Optional.of(new TicketHoldInfo(
                item.getHoldId(), UUID.randomUUID().toString(), item.getTicketType().name(), item.getQuantity(),
                payment.getBooking().getUser().getId(), Instant.now(), Instant.now().plusSeconds(300)
        )));

        paymentService.processCallback(successCallback(payment.getPayosOrderCode()));

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(payment.getBooking().getStatus()).isEqualTo(BookingStatus.PROCESSING);
        assertThat(payment.getReconciliationReason())
                .isEqualTo(PaymentReconciliationReason.CAPTURED_PAYMENT_HOLD_MISMATCH);
        verify(showScheduleRepository, never()).findAllByIdForUpdate(any());
        verify(ticketGenerationService, never()).generateTicketsIfMissing(any());
    }

    @Test
    void invalidSignatureDoesNotLoadOrUpdatePayment() {
        when(payOsClient.isValidCallback(any())).thenReturn(false);

        org.assertj.core.api.Assertions.assertThatThrownBy(
                () -> paymentService.processCallback(successCallback("123456789"))
        ).hasMessageContaining("Invalid PayOS callback signature");

        verifyNoInteractions(paymentRepository, bookingRepository);
        verify(ticketGenerationService, never()).generateTicketsIfMissing(any());
    }

    @Test
    void amountMismatchDoesNotMarkPaymentPaid() {
        Payment payment = pendingPayment();
        when(payOsClient.isValidCallback(any())).thenReturn(true);
        when(paymentRepository.findByPayosOrderCodeForUpdate(payment.getPayosOrderCode())).thenReturn(Optional.of(payment));

        PayOsCallbackRequest callback = successCallback(payment.getPayosOrderCode(), new BigDecimal("99999"));
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> paymentService.processCallback(callback))
                .hasMessageContaining("does not match");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(payment.getBooking().getStatus()).isEqualTo(BookingStatus.PENDING_PAYMENT);
        verify(ticketGenerationService, never()).generateTicketsIfMissing(any());
    }

    @Test
    void missingAmountDoesNotMarkPaymentPaid() {
        Payment payment = pendingPayment();
        when(payOsClient.isValidCallback(any())).thenReturn(true);
        when(paymentRepository.findByPayosOrderCodeForUpdate(payment.getPayosOrderCode())).thenReturn(Optional.of(payment));

        org.assertj.core.api.Assertions.assertThatThrownBy(
                () -> paymentService.processCallback(successCallback(payment.getPayosOrderCode(), null))
        ).hasMessageContaining("amount is required");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(payment.getBooking().getStatus()).isEqualTo(BookingStatus.PENDING_PAYMENT);
        verify(ticketGenerationService, never()).generateTicketsIfMissing(any());
    }

    @Test
    void unknownOrderCodeIsRejectedWithoutCreatingPayment() {
        when(payOsClient.isValidCallback(any())).thenReturn(true);
        when(paymentRepository.findByPayosOrderCodeForUpdate("unknown")).thenReturn(Optional.empty());

        org.assertj.core.api.Assertions.assertThatThrownBy(
                () -> paymentService.processCallback(successCallback("unknown"))
        ).hasMessageContaining("Payment not found");

        verify(paymentRepository, never()).save(any());
        verify(ticketGenerationService, never()).generateTicketsIfMissing(any());
    }

    @Test
    void webhookVerificationSampleDoesNotLoadOrUpdatePayment() {
        when(payOsClient.isValidCallback(any())).thenReturn(true);
        PayOsCallbackRequest sample = new PayOsCallbackRequest(
                "00",
                "success",
                true,
                java.util.Map.of(
                        "orderCode", 123,
                        "amount", 3000,
                        "description", "VQRIO123",
                        "code", "00"
                ),
                "signature",
                null,
                null,
                null,
                null
        );

        var response = paymentService.processCallback(sample);

        assertThat(response.bookingId()).isNull();
        assertThat(response.generatedTickets()).isZero();
        verifyNoInteractions(paymentRepository, bookingRepository);
        verify(ticketGenerationService, never()).generateTicketsIfMissing(any());
    }

    @Test
    void manualReconcilePaidPaymentUpdatesBooking() {
        Payment payment = pendingPayment();
        when(paymentRepository.findByBookingIdForUpdate(payment.getBooking().getId())).thenReturn(Optional.of(payment));
        when(payOsClient.getPaymentStatus(payment.getPayosOrderCode())).thenReturn(providerStatus(PaymentStatus.SUCCESS, "PAID"));

        var response = paymentService.reconcilePayment(
                new PaymentReconcileRequest(payment.getBooking().getId()),
                payment.getBooking().getUser()
        );

        assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(response.bookingStatus()).isEqualTo(BookingStatus.PAID);
        assertThat(response.reconciled()).isTrue();
    }

    @Test
    void manualReconcilePendingPaymentKeepsPendingState() {
        Payment payment = pendingPayment();
        when(paymentRepository.findByBookingIdForUpdate(payment.getBooking().getId())).thenReturn(Optional.of(payment));
        when(payOsClient.getPaymentStatus(payment.getPayosOrderCode())).thenReturn(providerStatus(PaymentStatus.PENDING, "PENDING"));

        var response = paymentService.reconcilePayment(
                new PaymentReconcileRequest(payment.getBooking().getId()),
                payment.getBooking().getUser()
        );

        assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(response.bookingStatus()).isEqualTo(BookingStatus.PENDING_PAYMENT);
        assertThat(response.reconciled()).isFalse();
        verify(paymentCompletedPublisher, never()).publish(any());
    }

    @Test
    void manualReconcileFailedPaymentUpdatesBooking() {
        Payment payment = pendingPayment();
        when(paymentRepository.findByBookingIdForUpdate(payment.getBooking().getId())).thenReturn(Optional.of(payment));
        when(payOsClient.getPaymentStatus(payment.getPayosOrderCode())).thenReturn(providerStatus(PaymentStatus.EXPIRED, "EXPIRED"));

        var response = paymentService.reconcilePayment(
                new PaymentReconcileRequest(payment.getBooking().getId()),
                payment.getBooking().getUser()
        );

        assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.EXPIRED);
        assertThat(response.bookingStatus()).isEqualTo(BookingStatus.EXPIRED);
        verify(redisTicketHoldService).releaseHold(payment.getBooking().getHoldId());
    }

    @Test
    void manualReconcileCancelledPaymentMarksBookingFailed() {
        Payment payment = pendingPayment();
        when(paymentRepository.findByBookingIdForUpdate(payment.getBooking().getId())).thenReturn(Optional.of(payment));
        when(payOsClient.getPaymentStatus(payment.getPayosOrderCode())).thenReturn(providerStatus(PaymentStatus.FAILED, "CANCELLED"));

        var response = paymentService.reconcilePayment(
                new PaymentReconcileRequest(payment.getBooking().getId()),
                payment.getBooking().getUser()
        );

        assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(response.bookingStatus()).isEqualTo(BookingStatus.FAILED);
    }

    @Test
    void automaticReconcileRecoversPaidPaymentAfterRestart() {
        Payment payment = pendingPayment();
        when(paymentRepository.findTop100ByStatusAndCreatedAtAfterOrderByCreatedAtAsc(
                any(PaymentStatus.class),
                any(Instant.class)
        )).thenReturn(List.of(payment));
        when(paymentRepository.findByIdForUpdate(payment.getId())).thenReturn(Optional.of(payment));
        when(payOsClient.getPaymentStatus(payment.getPayosOrderCode())).thenReturn(providerStatus(PaymentStatus.SUCCESS, "PAID"));

        paymentService.reconcilePendingPayments();

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(payment.getBooking().getStatus()).isEqualTo(BookingStatus.PAID);
        verify(ticketGenerationService).generateTicketsIfMissing(payment.getBooking());
    }

    @Test
    void createPaymentUsesBookingTotalAmount() {
        Payment existingShape = pendingPayment();
        Booking booking = existingShape.getBooking();
        booking.setUnitPrice(new BigDecimal("3000"));
        booking.setTotalAmount(new BigDecimal("6000"));
        User user = booking.getUser();
        when(bookingRepository.findByIdAndUser(booking.getId(), user)).thenReturn(Optional.of(booking));
        when(paymentRepository.findByBooking_Id(booking.getId())).thenReturn(Optional.empty());
        when(payOsClient.createPaymentLink(any(Booking.class), anyString())).thenReturn(new PayOsPaymentLink(
                "https://pay.payos.vn/new",
                "qr",
                "payment-link-id",
                "970422",
                "123456789",
                "ASMS",
                new BigDecimal("999999"),
                "ASMS payment"
        ));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = paymentService.createPayment(new CreatePaymentRequest(booking.getId()), user);

        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        assertThat(paymentCaptor.getValue().getAmount()).isEqualByComparingTo("6000");
        assertThat(response.amount()).isEqualByComparingTo("6000");
    }

    @Test
    void createOrGetPaymentSessionMarksNewProviderSessionAsCreated() {
        Payment existingShape = pendingPayment();
        Booking booking = existingShape.getBooking();
        when(paymentRepository.findByBooking_Id(booking.getId())).thenReturn(Optional.empty());
        when(payOsClient.createPaymentLink(eq(booking), anyString())).thenReturn(paymentLink());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var outcome = paymentService.createOrGetPaymentSession(booking);

        assertThat(outcome.providerSessionCreated()).isTrue();
        assertThat(outcome.response().bookingId()).isEqualTo(booking.getId());
        assertThat(outcome.response().checkoutUrl()).isEqualTo("https://pay.payos.vn/new");
    }

    @Test
    void createOrGetPaymentSessionReusesCompleteProviderSession() {
        Payment payment = pendingPayment();
        payment.setQrCode("existing-qr");
        payment.setPaymentLinkId("existing-link-id");
        when(paymentRepository.findByBooking_Id(payment.getBooking().getId())).thenReturn(Optional.of(payment));

        var outcome = paymentService.createOrGetPaymentSession(payment.getBooking());

        assertThat(outcome.providerSessionCreated()).isFalse();
        assertThat(outcome.response().qrCode()).isEqualTo("existing-qr");
        verify(payOsClient, never()).createPaymentLink(any(), anyString());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void idempotentRetryReturnsCapturedPaymentAfterBookingCompletion() {
        Payment payment = pendingPayment();
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.getBooking().setStatus(BookingStatus.PAID);
        when(paymentRepository.findByBooking_Id(payment.getBooking().getId())).thenReturn(Optional.of(payment));

        var outcome = paymentService.createOrGetPaymentSession(payment.getBooking());

        assertThat(outcome.providerSessionCreated()).isFalse();
        assertThat(outcome.response().status()).isEqualTo(PaymentStatus.SUCCESS);
        verify(payOsClient, never()).createPaymentLink(any(), anyString());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void createOrGetPaymentSessionRefreshesIncompletePendingSession() {
        Payment payment = pendingPayment();
        when(paymentRepository.findByBooking_Id(payment.getBooking().getId())).thenReturn(Optional.of(payment));
        when(payOsClient.createPaymentLink(payment.getBooking(), payment.getPayosOrderCode())).thenReturn(paymentLink());
        when(paymentRepository.save(payment)).thenReturn(payment);

        var outcome = paymentService.createOrGetPaymentSession(payment.getBooking());

        assertThat(outcome.providerSessionCreated()).isTrue();
        assertThat(outcome.response().paymentLinkId()).isEqualTo("payment-link-id");
        verify(paymentRepository).save(payment);
    }

    @Test
    void newPaymentPersistenceFailureCancelsCreatedProviderSession() {
        Booking booking = pendingPayment().getBooking();
        when(paymentRepository.findByBooking_Id(booking.getId())).thenReturn(Optional.empty());
        when(payOsClient.createPaymentLink(eq(booking), anyString())).thenReturn(paymentLink());
        when(paymentRepository.save(any(Payment.class))).thenThrow(new IllegalStateException("save failed"));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> paymentService.createOrGetPaymentSession(booking))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("save failed");

        verify(payOsClient).cancelPaymentLink(anyString(), eq("CANCELLED"));
    }

    private PayOsPaymentLink paymentLink() {
        return new PayOsPaymentLink(
                "https://pay.payos.vn/new", "qr", "payment-link-id", "970422",
                "123456789", "ASMS", new BigDecimal("100000"), "ASMS payment"
        );
    }

    private Payment pendingPayment() {
        User user = new User("Test", "User", "user@example.com", "0900000000", "hash");
        Show show = new Show("Aqua Show", "Water show", null, 45);
        Venue venue = new Venue("Main Pool", "Central lagoon", 100);
        LocalDateTime start = LocalDateTime.now().plusDays(1);
        ShowSchedule schedule = new ShowSchedule(
                show, venue, start, start.plusMinutes(45), 10, 0, 0, new BigDecimal("100000")
        );
        Booking booking = Booking.create(user, "AQB-TEST", Instant.now().plusSeconds(900));
        setId(booking, UUID.randomUUID());
        booking.addItem(BookingItem.create(
                booking, schedule, TicketType.STANDARD, 1, new BigDecimal("100000"), "hold-test"
        ));
        when(redisTicketHoldService.getHold("hold-test"))
                .thenReturn(Optional.of(validHold(booking, booking.getItems().getFirst())));
        when(showScheduleRepository.findAllByIdForUpdate(List.of(schedule.getId()))).thenReturn(List.of(schedule));
        return new Payment(booking, "123456789", booking.getTotalAmount(), "https://pay.payos.vn/test");
    }

    private CapturedInventoryFixture capturedInventoryFixture(int available) {
        User user = new User("Late", "Payment", "late@example.com", "0900000009", "hash");
        Show show = new Show("Late Capture Show", "Water show", null, 45);
        Venue venue = new Venue("Recovery Pool", "Central lagoon", 100);
        LocalDateTime start = LocalDateTime.now().plusDays(1);
        ShowSchedule schedule = new ShowSchedule(
                show, venue, start, start.plusMinutes(45), 1, 0, 0, new BigDecimal("100000")
        );
        schedule.setStandardAvailableTickets(available);
        Booking booking = Booking.create(user, "AQB-LATE", Instant.now().minusSeconds(1));
        setId(booking, UUID.randomUUID());
        booking.addItem(BookingItem.create(
                booking, schedule, TicketType.STANDARD, 1, new BigDecimal("100000"), "hold-late"
        ));
        Payment payment = new Payment(booking, "987650001", booking.getTotalAmount(), "https://pay.payos.vn/late");
        when(payOsClient.isValidCallback(any())).thenReturn(true);
        when(paymentRepository.findByPayosOrderCodeForUpdate(payment.getPayosOrderCode()))
                .thenReturn(Optional.of(payment));
        when(redisTicketHoldService.getHold("hold-late")).thenReturn(Optional.empty());
        when(showScheduleRepository.findAllByIdForUpdate(List.of(schedule.getId())))
                .thenReturn(List.of(schedule));
        return new CapturedInventoryFixture(payment, schedule);
    }

    private PayOsCallbackRequest successCallback(String orderCode) {
        return successCallback(orderCode, new BigDecimal("100000"));
    }

    private TicketHoldInfo validHold(Booking booking, BookingItem item) {
        return new TicketHoldInfo(
                item.getHoldId(), item.getScheduleId(), item.getTicketType().name(), item.getQuantity(),
                booking.getUser().getId(), Instant.now(), Instant.now().plusSeconds(300)
        );
    }

    private PayOsCallbackRequest successCallback(String orderCode, BigDecimal amount) {
        return new PayOsCallbackRequest(
                "00",
                "success",
                true,
                null,
                "signature",
                orderCode,
                "transaction-1",
                amount,
                "SUCCESS"
        );
    }

    private PayOsPaymentStatus providerStatus(PaymentStatus status, String rawStatus) {
        return new PayOsPaymentStatus(
                "123456789",
                rawStatus,
                status,
                status == PaymentStatus.SUCCESS ? "transaction-1" : null,
                status == PaymentStatus.SUCCESS ? Instant.now() : null,
                new BigDecimal("100000")
        );
    }

    private void setId(Booking booking, UUID id) {
        try {
            Field field = Booking.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(booking, id);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private record CapturedInventoryFixture(Payment payment, ShowSchedule schedule) {
    }
}
