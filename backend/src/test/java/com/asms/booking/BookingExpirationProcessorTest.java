package com.asms.booking;

import com.asms.booking.entity.Booking;
import com.asms.booking.entity.BookingItem;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.enums.TicketType;
import com.asms.booking.repository.BookingRepository;
import com.asms.booking.service.BookingExpirationProcessor;
import com.asms.booking.service.RedisTicketHoldService;
import com.asms.catalog.entity.Show;
import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.entity.Venue;
import com.asms.identity.entity.User;
import com.asms.payment.entity.Payment;
import com.asms.payment.enums.PaymentStatus;
import com.asms.payment.integration.PayOsClient;
import com.asms.payment.repository.PaymentRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BookingExpirationProcessorTest {

    private BookingRepository bookingRepository;
    private PaymentRepository paymentRepository;
    private RedisTicketHoldService redisTicketHoldService;
    private PayOsClient payOsClient;
    private BookingExpirationProcessor processor;

    @BeforeEach
    void setUp() {
        bookingRepository = mock(BookingRepository.class);
        paymentRepository = mock(PaymentRepository.class);
        redisTicketHoldService = mock(RedisTicketHoldService.class);
        payOsClient = mock(PayOsClient.class);
        processor = new BookingExpirationProcessor(
                bookingRepository,
                paymentRepository,
                redisTicketHoldService,
                payOsClient
        );
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void overdueBookingAndPendingPaymentExpireBeforeCleanupRunsAfterCommit() {
        Booking booking = overdueBooking();
        Payment payment = pendingPayment(booking);
        when(paymentRepository.findByBookingIdForUpdate(booking.getId())).thenReturn(Optional.of(payment));
        when(bookingRepository.findByIdForUpdate(booking.getId())).thenReturn(Optional.of(booking));
        TransactionSynchronizationManager.initSynchronization();

        boolean expired = processor.expireIfOverdue(booking.getId(), Instant.now());

        assertThat(expired).isTrue();
        assertThat(booking.getStatus()).isEqualTo(BookingStatus.EXPIRED);
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.EXPIRED);
        verify(redisTicketHoldService, never()).releaseHold("hold-expiry-test");
        verify(payOsClient, never()).cancelPaymentLink(payment.getPayosOrderCode(), "EXPIRED");

        TransactionSynchronizationManager.getSynchronizations()
                .forEach(synchronization -> synchronization.afterCommit());

        verify(redisTicketHoldService).releaseHold("hold-expiry-test");
        verify(payOsClient).cancelPaymentLink(payment.getPayosOrderCode(), "EXPIRED");
    }

    @Test
    void successfulPaymentWinsConcurrentExpirationCheck() {
        Booking booking = overdueBooking();
        Payment payment = pendingPayment(booking);
        payment.setStatus(PaymentStatus.SUCCESS);
        when(paymentRepository.findByBookingIdForUpdate(booking.getId())).thenReturn(Optional.of(payment));
        when(bookingRepository.findByIdForUpdate(booking.getId())).thenReturn(Optional.of(booking));

        boolean expired = processor.expireIfOverdue(booking.getId(), Instant.now());

        assertThat(expired).isFalse();
        assertThat(booking.getStatus()).isEqualTo(BookingStatus.PENDING_PAYMENT);
        verify(bookingRepository, never()).save(booking);
        verify(redisTicketHoldService, never()).releaseHold("hold-expiry-test");
    }

    @Test
    void cleanupFailuresAreBestEffortAndDoNotSkipPayOsCancellation() {
        Booking booking = overdueBooking();
        Payment payment = pendingPayment(booking);
        when(paymentRepository.findByBookingIdForUpdate(booking.getId())).thenReturn(Optional.of(payment));
        when(bookingRepository.findByIdForUpdate(booking.getId())).thenReturn(Optional.of(booking));
        doThrow(new IllegalStateException("redis unavailable"))
                .when(redisTicketHoldService).releaseHold("hold-expiry-test");

        assertThat(processor.expireIfOverdue(booking.getId(), Instant.now())).isTrue();

        verify(payOsClient).cancelPaymentLink(payment.getPayosOrderCode(), "EXPIRED");
    }

    @Test
    void bookingThatIsNoLongerPendingIsIgnoredAfterLocking() {
        Booking booking = overdueBooking();
        booking.setStatus(BookingStatus.PAID);
        when(paymentRepository.findByBookingIdForUpdate(booking.getId())).thenReturn(Optional.empty());
        when(bookingRepository.findByIdForUpdate(booking.getId())).thenReturn(Optional.of(booking));

        assertThat(processor.expireIfOverdue(booking.getId(), Instant.now())).isFalse();

        verify(bookingRepository, never()).save(booking);
    }

    private Booking overdueBooking() {
        User user = new User("Expiry", "User", "expiry@example.com", "0900000000", "hash");
        Show show = new Show("Aqua Show", "Water show", null, 45);
        Venue venue = new Venue("Main Pool", "Central lagoon", 100);
        LocalDateTime start = LocalDateTime.now().plusDays(1);
        ShowSchedule schedule = new ShowSchedule(
                show, venue, start, start.plusMinutes(45), 10, 0, 0, new BigDecimal("100000")
        );
        Booking booking = Booking.create(user, "AQB-EXPIRY", Instant.now().minusSeconds(60));
        setId(booking, UUID.randomUUID());
        booking.addItem(BookingItem.create(
                booking, schedule, TicketType.STANDARD, 1, new BigDecimal("100000"), "hold-expiry-test"
        ));
        return booking;
    }

    private Payment pendingPayment(Booking booking) {
        return new Payment(booking, "987654321", booking.getTotalAmount(), "https://pay.payos.vn/expiry");
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
