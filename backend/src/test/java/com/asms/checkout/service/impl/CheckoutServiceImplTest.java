package com.asms.checkout.service.impl;

import com.asms.booking.entity.Booking;
import com.asms.booking.entity.BookingItem;
import com.asms.booking.repository.BookingRepository;
import com.asms.booking.service.RedisTicketHoldService;
import com.asms.booking.service.TicketPricingService;
import com.asms.booking.dto.TicketHoldDtos.HoldResult;
import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.enums.ScheduleStatus;
import com.asms.catalog.repository.ShowScheduleRepository;
import com.asms.checkout.dto.CheckoutDtos.*;
import com.asms.checkout.exception.CheckoutReviewRequiredException;
import com.asms.checkout.service.CheckoutIdempotencyLockService;
import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.ConflictException;
import com.asms.core.exception.ErrorCode;
import com.asms.core.exception.UnauthorizedException;
import com.asms.identity.entity.User;
import com.asms.payment.entity.Payment;
import com.asms.payment.integration.PayOsClient;
import com.asms.payment.integration.PayOsPaymentLink;
import com.asms.payment.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionException;
import org.springframework.transaction.TransactionStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CheckoutServiceImplTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private ShowScheduleRepository scheduleRepository;
    @Mock private RedisTicketHoldService redisTicketHoldService;
    @Mock private TicketPricingService ticketPricingService;
    @Mock private PaymentRepository paymentRepository;
    @Mock private PayOsClient payOsClient;
    @Mock private PlatformTransactionManager transactionManager;
    @Mock private TransactionStatus transactionStatus;
    @Mock private CheckoutIdempotencyLockService idempotencyLockService;

    private CheckoutServiceImpl checkoutService;
    private User testUser;
    private ShowSchedule testSchedule;

    @BeforeEach
    void setUp() {
        checkoutService = new CheckoutServiceImpl(
                bookingRepository, scheduleRepository, redisTicketHoldService,
                ticketPricingService, paymentRepository, payOsClient, transactionManager,
                idempotencyLockService
        );
        lenient().when(idempotencyLockService.execute(any(), anyString(), any()))
                .thenAnswer(invocation -> ((java.util.function.Supplier<?>) invocation.getArgument(2)).get());

        testUser = mock(User.class);
        lenient().when(testUser.getId()).thenReturn(UUID.randomUUID());

        testSchedule = mock(ShowSchedule.class);
        lenient().when(testSchedule.getId()).thenReturn(UUID.randomUUID());
        lenient().when(testSchedule.getStatus()).thenReturn(ScheduleStatus.ACTIVE);
        lenient().when(testSchedule.getStartTime()).thenReturn(LocalDateTime.now().plusDays(1));
        com.asms.catalog.entity.Show mockShow = mock(com.asms.catalog.entity.Show.class);
        lenient().when(mockShow.getId()).thenReturn(UUID.randomUUID());
        lenient().when(mockShow.getTitle()).thenReturn("Test Show");
        lenient().when(testSchedule.getShow()).thenReturn(mockShow);

        com.asms.catalog.entity.Venue mockVenue = mock(com.asms.catalog.entity.Venue.class);
        lenient().when(mockVenue.getId()).thenReturn(UUID.randomUUID());
        lenient().when(mockVenue.getName()).thenReturn("Test Venue");
        lenient().when(testSchedule.getVenue()).thenReturn(mockVenue);

        lenient().when(transactionManager.getTransaction(any(TransactionDefinition.class))).thenAnswer(invocation -> {
            TransactionSynchronizationManager.initSynchronization();
            return transactionStatus;
        });
        lenient().doAnswer(invocation -> {
            TransactionSynchronizationManager.getSynchronizations()
                    .forEach(TransactionSynchronization::afterCommit);
            TransactionSynchronizationManager.getSynchronizations()
                    .forEach(synchronization -> synchronization.afterCompletion(TransactionSynchronization.STATUS_COMMITTED));
            TransactionSynchronizationManager.clearSynchronization();
            return null;
        }).when(transactionManager).commit(transactionStatus);
        lenient().doAnswer(invocation -> {
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.getSynchronizations()
                        .forEach(synchronization -> synchronization.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
                TransactionSynchronizationManager.clearSynchronization();
            }
            return null;
        }).when(transactionManager).rollback(transactionStatus);
    }

    @Test
    void testStartPayment_Unauthorized() {
        assertThrows(UnauthorizedException.class, () ->
                checkoutService.startPayment(new StartPaymentRequest("idemp", List.of()), null)
        );
    }

    @Test
    void testStartPayment_ReviewRequired() {
        when(bookingRepository.findByUserAndIdempotencyKey(any(), anyString())).thenReturn(Optional.empty());
        when(scheduleRepository.findById(any())).thenReturn(Optional.of(testSchedule));

        when(testSchedule.availableFor(any())).thenReturn(10);
        when(ticketPricingService.unitPrice(any(), any())).thenReturn(new BigDecimal("120.00"));

        StartPaymentRequest req = new StartPaymentRequest("key1", List.of(
                new CheckoutItemRequest(testSchedule.getId().toString(), "STANDARD", 2, new BigDecimal("100.00"))
        ));

        CheckoutReviewRequiredException ex = assertThrows(CheckoutReviewRequiredException.class, () ->
                checkoutService.startPayment(req, testUser)
        );

        assertNotNull(ex.getData());
        assertEquals(1, ex.getData().items().size());
        assertEquals(new BigDecimal("100.00"), ex.getData().items().get(0).expectedUnitPrice());
        assertEquals(new BigDecimal("120.00"), ex.getData().items().get(0).currentUnitPrice());
    }

    @Test
    void successfulTransactionKeepsHoldsAndProviderPaymentLink() {
        stubBookableSchedule(testSchedule);
        when(redisTicketHoldService.holdTickets(anyString(), any(), anyInt(), any()))
                .thenReturn(successfulHold("hold123"));
        stubSavedBooking();
        when(payOsClient.createPaymentLink(any(), anyString())).thenReturn(paymentLink());

        StartPaymentResponse resp = checkoutService.startPayment(requestFor(testSchedule, "key2"), testUser);

        assertNotNull(resp);
        assertEquals("PENDING_PAYMENT", resp.bookingStatus());
        assertNotNull(resp.payment());
        assertEquals("http://checkout", resp.payment().checkoutUrl());

        verify(paymentRepository).save(any(Payment.class));
        verify(redisTicketHoldService, never()).releaseHold(anyString());
        verify(payOsClient, never()).cancelPaymentLink(anyString(), anyString());
    }

    @Test
    void payOsCreationFailureReleasesHoldsWithoutCancellingProviderLink() {
        stubBookableSchedule(testSchedule);
        when(redisTicketHoldService.holdTickets(anyString(), any(), anyInt(), any()))
                .thenReturn(successfulHold("hold-payos-failure"));
        stubSavedBooking();
        when(payOsClient.createPaymentLink(any(), anyString())).thenThrow(new IllegalStateException("PayOS unavailable"));

        IllegalStateException failure = assertThrows(IllegalStateException.class,
                () -> checkoutService.startPayment(requestFor(testSchedule, "key-payos-failure"), testUser));

        assertEquals("PayOS unavailable", failure.getMessage());
        verify(redisTicketHoldService).releaseHold("hold-payos-failure");
        verify(payOsClient, never()).cancelPaymentLink(anyString(), anyString());
    }

    @Test
    void paymentSaveFailureReleasesHoldsAndCancelsCreatedProviderLink() {
        stubBookableSchedule(testSchedule);
        when(redisTicketHoldService.holdTickets(anyString(), any(), anyInt(), any()))
                .thenReturn(successfulHold("hold-payment-save-failure"));
        stubSavedBooking();
        AtomicReference<String> createdOrderCode = stubCreatedProviderLink();
        when(paymentRepository.save(any(Payment.class))).thenThrow(new IllegalStateException("payment save failed"));

        IllegalStateException failure = assertThrows(IllegalStateException.class,
                () -> checkoutService.startPayment(requestFor(testSchedule, "key-payment-save-failure"), testUser));

        assertEquals("payment save failed", failure.getMessage());
        verify(redisTicketHoldService).releaseHold("hold-payment-save-failure");
        verify(payOsClient).cancelPaymentLink(eq(createdOrderCode.get()), eq("CANCELLED"));
    }

    @Test
    void commitFailureReleasesHoldsAndCancelsCreatedProviderLink() {
        stubBookableSchedule(testSchedule);
        when(redisTicketHoldService.holdTickets(anyString(), any(), anyInt(), any()))
                .thenReturn(successfulHold("hold-commit-failure"));
        stubSavedBooking();
        AtomicReference<String> createdOrderCode = stubCreatedProviderLink();
        doAnswer(invocation -> {
            TransactionSynchronizationManager.clearSynchronization();
            throw new TestTransactionException("commit failed");
        }).when(transactionManager).commit(transactionStatus);

        TestTransactionException failure = assertThrows(TestTransactionException.class,
                () -> checkoutService.startPayment(requestFor(testSchedule, "key-commit-failure"), testUser));

        assertEquals("commit failed", failure.getMessage());
        verify(redisTicketHoldService).releaseHold("hold-commit-failure");
        verify(payOsClient).cancelPaymentLink(eq(createdOrderCode.get()), eq("CANCELLED"));
    }

    @Test
    void partialHoldFailureReleasesPreviouslyAcquiredHolds() {
        ShowSchedule secondSchedule = mockSchedule();
        when(bookingRepository.findByUserAndIdempotencyKey(any(), anyString())).thenReturn(Optional.empty());
        when(scheduleRepository.findById(testSchedule.getId())).thenReturn(Optional.of(testSchedule));
        when(scheduleRepository.findById(secondSchedule.getId())).thenReturn(Optional.of(secondSchedule));
        when(testSchedule.availableFor(any())).thenReturn(10);
        when(ticketPricingService.unitPrice(any(), any())).thenReturn(new BigDecimal("100.00"));
        HoldResult failedSecondHold = new HoldResult(false, null, secondSchedule.getId().toString(), null);
        when(redisTicketHoldService.holdTickets(eq(testSchedule.getId().toString()), any(), anyInt(), any()))
                .thenReturn(successfulHold("hold-first"));
        when(redisTicketHoldService.holdTickets(eq(secondSchedule.getId().toString()), any(), anyInt(), any()))
                .thenReturn(failedSecondHold);

        StartPaymentRequest request = new StartPaymentRequest("key-partial-hold", List.of(
                checkoutItem(testSchedule), checkoutItem(secondSchedule)
        ));

        assertThrows(ConflictException.class, () -> checkoutService.startPayment(request, testUser));

        verify(redisTicketHoldService).releaseHold("hold-first");
        verifyNoInteractions(payOsClient);
        verifyNoInteractions(paymentRepository);
    }

    @Test
    void sameIdempotencyPayloadReturnsExistingPaymentWithoutSideEffects() {
        Booking existing = mockExistingBooking(new BigDecimal("100.00"));
        when(bookingRepository.findByUserAndIdempotencyKey(testUser, "same-key"))
                .thenReturn(Optional.of(existing));

        StartPaymentResponse response = checkoutService.startPayment(requestFor(testSchedule, "same-key"), testUser);

        assertEquals(existing.getId().toString(), response.bookingId());
        verifyNoInteractions(scheduleRepository, redisTicketHoldService, payOsClient);
        verify(paymentRepository).findByBooking_Id(existing.getId());
    }

    @Test
    void priceOnlyIdempotencyMismatchIsRejectedWithStableCode() {
        Booking existing = mockExistingBooking(new BigDecimal("120.00"));
        when(bookingRepository.findByUserAndIdempotencyKey(testUser, "price-mismatch"))
                .thenReturn(Optional.of(existing));

        ConflictException failure = assertThrows(ConflictException.class,
                () -> checkoutService.startPayment(requestFor(testSchedule, "price-mismatch"), testUser));

        assertEquals(ErrorCode.IDEMPOTENCY_KEY_REUSED, failure.getCode());
        verifyNoInteractions(scheduleRepository, redisTicketHoldService, paymentRepository, payOsClient);
    }

    @Test
    void serializedRetryRequeriesBookingAndDoesNotDuplicateCheckoutSideEffects() {
        stubBookableSchedule(testSchedule);
        AtomicReference<Booking> committedBooking = new AtomicReference<>();
        when(bookingRepository.findByUserAndIdempotencyKey(testUser, "concurrent-key"))
                .thenAnswer(invocation -> Optional.ofNullable(committedBooking.get()));
        when(redisTicketHoldService.holdTickets(anyString(), any(), anyInt(), any()))
                .thenReturn(successfulHold("hold-once"));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            ReflectionTestUtils.setField(booking, "id", UUID.randomUUID());
            committedBooking.set(booking);
            return booking;
        });
        when(payOsClient.createPaymentLink(any(), anyString())).thenReturn(paymentLink());
        when(paymentRepository.findByBooking_Id(any())).thenReturn(Optional.empty());

        StartPaymentRequest request = requestFor(testSchedule, "concurrent-key");
        StartPaymentResponse first = checkoutService.startPayment(request, testUser);
        StartPaymentResponse second = checkoutService.startPayment(request, testUser);

        assertEquals(first.bookingId(), second.bookingId());
        verify(redisTicketHoldService, times(1)).holdTickets(anyString(), any(), anyInt(), any());
        verify(payOsClient, times(1)).createPaymentLink(any(), anyString());
        verify(idempotencyLockService, times(2)).execute(eq(testUser.getId()), eq("concurrent-key"), any());
    }

    private void stubBookableSchedule(ShowSchedule schedule) {
        when(bookingRepository.findByUserAndIdempotencyKey(any(), anyString())).thenReturn(Optional.empty());
        when(scheduleRepository.findById(schedule.getId())).thenReturn(Optional.of(schedule));
        when(schedule.availableFor(any())).thenReturn(10);
        when(ticketPricingService.unitPrice(any(), any())).thenReturn(new BigDecimal("100.00"));
    }

    private void stubSavedBooking() {
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            ReflectionTestUtils.setField(booking, "id", UUID.randomUUID());
            return booking;
        });
    }

    private AtomicReference<String> stubCreatedProviderLink() {
        AtomicReference<String> createdOrderCode = new AtomicReference<>();
        when(payOsClient.createPaymentLink(any(), anyString())).thenAnswer(invocation -> {
            createdOrderCode.set(invocation.getArgument(1));
            return paymentLink();
        });
        return createdOrderCode;
    }

    private StartPaymentRequest requestFor(ShowSchedule schedule, String idempotencyKey) {
        return new StartPaymentRequest(idempotencyKey, List.of(checkoutItem(schedule)));
    }

    private CheckoutItemRequest checkoutItem(ShowSchedule schedule) {
        return new CheckoutItemRequest(schedule.getId().toString(), "STANDARD", 2, new BigDecimal("100.00"));
    }

    private HoldResult successfulHold(String holdId) {
        return new HoldResult(true, holdId, "schedule", Instant.now().plusSeconds(600));
    }

    private PayOsPaymentLink paymentLink() {
        return new PayOsPaymentLink("http://checkout", "qr", "pid", "bin", "acc", "name", new BigDecimal("200.00"), "desc");
    }

    private ShowSchedule mockSchedule() {
        ShowSchedule schedule = mock(ShowSchedule.class);
        when(schedule.getId()).thenReturn(UUID.randomUUID());
        when(schedule.getStatus()).thenReturn(ScheduleStatus.ACTIVE);
        when(schedule.getStartTime()).thenReturn(LocalDateTime.now().plusDays(1));
        when(schedule.availableFor(any())).thenReturn(10);
        return schedule;
    }

    private Booking mockExistingBooking(BigDecimal unitPrice) {
        Booking booking = mock(Booking.class);
        BookingItem item = mock(BookingItem.class);
        UUID bookingId = UUID.randomUUID();
        String scheduleId = testSchedule.getId().toString();
        lenient().when(booking.getId()).thenReturn(bookingId);
        lenient().when(booking.getStatus()).thenReturn(com.asms.booking.enums.BookingStatus.PENDING_PAYMENT);
        lenient().when(booking.getExpiresAt()).thenReturn(Instant.now().plusSeconds(600));
        lenient().when(booking.getTotalQuantity()).thenReturn(2);
        lenient().when(booking.getTotalAmount()).thenReturn(unitPrice.multiply(BigDecimal.valueOf(2)));
        when(booking.getItems()).thenReturn(List.of(item));
        when(item.getScheduleId()).thenReturn(scheduleId);
        when(item.getTicketType()).thenReturn(com.asms.booking.enums.TicketType.STANDARD);
        when(item.getQuantity()).thenReturn(2);
        when(item.getUnitPrice()).thenReturn(unitPrice);
        return booking;
    }

    private static final class TestTransactionException extends TransactionException {
        private TestTransactionException(String message) {
            super(message);
        }
    }
}
