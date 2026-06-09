package com.asms.payment;

import com.asms.booking.entity.Booking;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.repository.BookingRepository;
import com.asms.booking.service.RedisTicketHoldService;
import com.asms.identity.entity.User;
import com.asms.payment.dto.CreatePaymentRequest;
import com.asms.payment.dto.PayOsCallbackRequest;
import com.asms.payment.dto.PaymentReconcileRequest;
import com.asms.payment.entity.Payment;
import com.asms.payment.enums.PaymentStatus;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
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
    private PaymentServiceImpl paymentService;

    @BeforeEach
    void setUp() {
        bookingRepository = mock(BookingRepository.class);
        paymentRepository = mock(PaymentRepository.class);
        payOsClient = mock(PayOsClient.class);
        ticketGenerationService = mock(TicketGenerationService.class);
        paymentCompletedPublisher = mock(PaymentCompletedPublisher.class);
        redisTicketHoldService = mock(RedisTicketHoldService.class);
        when(ticketGenerationService.generateTicketsIfMissing(any())).thenReturn(List.of(mock(Ticket.class)));

        paymentService = new PaymentServiceImpl(
                bookingRepository,
                paymentRepository,
                payOsClient,
                ticketGenerationService,
                paymentCompletedPublisher,
                redisTicketHoldService
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
    void duplicateCallbackDoesNotPublishDuplicateCompletionTask() {
        Payment payment = pendingPayment();
        when(payOsClient.isValidCallback(any())).thenReturn(true);
        when(paymentRepository.findByPayosOrderCodeForUpdate(payment.getPayosOrderCode())).thenReturn(Optional.of(payment));

        paymentService.processCallback(successCallback(payment.getPayosOrderCode()));
        paymentService.processCallback(successCallback(payment.getPayosOrderCode()));

        verify(paymentCompletedPublisher, times(1)).publish(any());
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

    private Payment pendingPayment() {
        User user = new User("Test", "User", "user@example.com", "0900000000", "hash");
        Booking booking = Booking.create();
        setId(booking, UUID.randomUUID());
        booking.setUser(user);
        booking.setBookingCode("AQB-TEST");
        booking.setHoldId("hold-test");
        booking.setShowId("show-1");
        booking.setScheduleId("schedule-1");
        booking.setShowName("Aqua Show");
        booking.setShowDate(LocalDate.now().plusDays(1));
        booking.setTicketType("STANDARD");
        booking.setQuantity(1);
        booking.setUnitPrice(new BigDecimal("100000"));
        booking.setTotalAmount(new BigDecimal("100000"));
        booking.setStatus(BookingStatus.PENDING_PAYMENT);
        booking.setExpiresAt(Instant.now().plusSeconds(900));
        return new Payment(booking, "123456789", booking.getTotalAmount(), "https://pay.payos.vn/test");
    }

    private PayOsCallbackRequest successCallback(String orderCode) {
        return new PayOsCallbackRequest(
                "00",
                "success",
                true,
                null,
                "signature",
                orderCode,
                "transaction-1",
                new BigDecimal("100000"),
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
}
