package com.asms.booking;

import com.asms.booking.dto.BookingDtos.BookingResponse;
import com.asms.booking.dto.BookingDtos.BookingMessage;
import com.asms.booking.dto.BookingDtos.CreateBookingRequest;
import com.asms.booking.dto.BookingDtos.CreateBookingResponse;
import com.asms.booking.dto.BookingDtos.PageBookingResponse;
import com.asms.booking.dto.TicketHoldDtos.HoldResult;
import com.asms.booking.entity.Booking;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.messaging.RabbitMQBookingPublisher;
import com.asms.booking.repository.BookingRepository;
import com.asms.booking.service.BookingService;
import com.asms.booking.service.RedisTicketHoldService;
import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.ConflictException;
import com.asms.core.exception.NotFoundException;
import com.asms.core.exception.UnauthorizedException;
import com.asms.core.response.ApiResponse;
import com.asms.identity.entity.User;
import com.asms.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BookingServiceControllerTest {

    private BookingRepository bookingRepository;
    private UserRepository userRepository;
    private RedisTicketHoldService redisTicketHoldService;
    private RabbitMQBookingPublisher bookingPublisher;
    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        bookingRepository = mock(BookingRepository.class);
        userRepository = mock(UserRepository.class);
        redisTicketHoldService = mock(RedisTicketHoldService.class);
        bookingPublisher = mock(RabbitMQBookingPublisher.class);
        bookingService = new com.asms.booking.service.impl.BookingServiceImpl(
                bookingRepository,
                userRepository,
                redisTicketHoldService,
                bookingPublisher
        );
    }

    @Test
    void createBookingHoldsTicketsAndPublishesMessage() {
        User user = user("user@example.com");
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(redisTicketHoldService.holdTickets("schedule-1", "STANDARD", 2, user.getId()))
                .thenReturn(new HoldResult(true, "hold-123", "held", Instant.parse("2026-05-31T15:15:00Z")));

        CreateBookingResponse response = bookingService.createBooking(validRequest("STANDARD", 2), "user@example.com");

        assertThat(response.status()).isEqualTo(BookingStatus.PROCESSING);
        assertThat(response.holdId()).isEqualTo("hold-123");
        assertThat(response.message()).isEqualTo("Booking request is being processed.");
        org.mockito.ArgumentCaptor<BookingMessage> messageCaptor = org.mockito.ArgumentCaptor.forClass(BookingMessage.class);
        verify(bookingPublisher).publishCreateBooking(messageCaptor.capture());
        assertThat(messageCaptor.getValue().unitPrice()).isEqualByComparingTo("45.00");
        assertThat(messageCaptor.getValue().totalAmount()).isEqualByComparingTo("90.00");
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void createBookingRejectsUnknownTicketType() {
        User user = user("user@example.com");
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> bookingService.createBooking(validRequest("GOLD", 2), "user@example.com"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Unknown ticket type");

        verify(redisTicketHoldService, never()).holdTickets(any(), any(), any(Integer.class), any());
        verify(bookingPublisher, never()).publishCreateBooking(any());
    }

    @Test
    void createBookingThrowsConflictWhenRedisHoldFails() {
        User user = user("user@example.com");
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(redisTicketHoldService.holdTickets("schedule-1", "VIP", 10, user.getId()))
                .thenReturn(new HoldResult(false, null, "insufficient", null));

        assertThatThrownBy(() -> bookingService.createBooking(validRequest("VIP", 10), "user@example.com"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Not enough tickets available");

        verify(bookingPublisher, never()).publishCreateBooking(any());
    }

    @Test
    void createBookingReleasesHoldWhenRabbitPublishFails() {
        User user = user("user@example.com");
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(redisTicketHoldService.holdTickets("schedule-1", "FAMILY", 2, user.getId()))
                .thenReturn(new HoldResult(true, "hold-123", "held", Instant.parse("2026-05-31T15:15:00Z")));
        doThrow(new IllegalStateException("rabbit down")).when(bookingPublisher).publishCreateBooking(any());

        assertThatThrownBy(() -> bookingService.createBooking(validRequest("FAMILY", 2), "user@example.com"))
                .hasMessageContaining("Booking service is temporarily unavailable");

        verify(redisTicketHoldService).releaseHold("hold-123");
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void getMyBookingsReturnsOnlyCurrentUserBookings() {
        User user = user("user@example.com");
        Booking booking = booking(user, "hold-123");
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(bookingRepository.findByUserOrderByCreatedAtDesc(eq(user), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(booking), org.springframework.data.domain.PageRequest.of(0, 5), 1));

        PageBookingResponse response = bookingService.getMyBookings("user@example.com", 0, 5);

        assertThat(response.items()).hasSize(1);
        assertThat(response.items().getFirst().holdId()).isEqualTo("hold-123");
        assertThat(response.page()).isZero();
        assertThat(response.size()).isEqualTo(5);
        assertThat(response.totalItems()).isEqualTo(1);
        assertThat(response.totalPages()).isEqualTo(1);
        assertThat(response.hasNext()).isFalse();
        assertThat(response.hasPrevious()).isFalse();
    }

    @Test
    void getMyBookingsReturnsFiveItemsByDefaultAndNewestOrderFromRepository() {
        User user = user("user@example.com");
        List<Booking> pageItems = List.of(
                booking(user, "hold-1", "AQB20260531NEW001"),
                booking(user, "hold-2", "AQB20260531NEW002"),
                booking(user, "hold-3", "AQB20260531NEW003"),
                booking(user, "hold-4", "AQB20260531NEW004"),
                booking(user, "hold-5", "AQB20260531NEW005")
        );
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(bookingRepository.findByUserOrderByCreatedAtDesc(eq(user), any(Pageable.class)))
                .thenReturn(new PageImpl<>(pageItems, org.springframework.data.domain.PageRequest.of(0, 5), 12));

        PageBookingResponse response = bookingService.getMyBookings("user@example.com", 0, 5);

        assertThat(response.items()).hasSize(5);
        assertThat(response.items().getFirst().bookingCode()).isEqualTo("AQB20260531NEW001");
        assertThat(response.page()).isZero();
        assertThat(response.size()).isEqualTo(5);
        assertThat(response.totalItems()).isEqualTo(12);
        assertThat(response.totalPages()).isEqualTo(3);
        assertThat(response.hasNext()).isTrue();
        assertThat(response.hasPrevious()).isFalse();
    }

    @Test
    void getMyBookingsPageOneReturnsNextFiveItems() {
        User user = user("user@example.com");
        List<Booking> pageItems = List.of(
                booking(user, "hold-6", "AQB20260531NEXT06"),
                booking(user, "hold-7", "AQB20260531NEXT07"),
                booking(user, "hold-8", "AQB20260531NEXT08"),
                booking(user, "hold-9", "AQB20260531NEXT09"),
                booking(user, "hold-10", "AQB20260531NEXT10")
        );
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(bookingRepository.findByUserOrderByCreatedAtDesc(eq(user), any(Pageable.class)))
                .thenReturn(new PageImpl<>(pageItems, org.springframework.data.domain.PageRequest.of(1, 5), 12));

        PageBookingResponse response = bookingService.getMyBookings("user@example.com", 1, 5);

        assertThat(response.items()).hasSize(5);
        assertThat(response.items().getFirst().bookingCode()).isEqualTo("AQB20260531NEXT06");
        assertThat(response.page()).isEqualTo(1);
        assertThat(response.hasNext()).isTrue();
        assertThat(response.hasPrevious()).isTrue();
    }

    @Test
    void getMyBookingsClampsNegativePageAndOversizedPageSize() {
        User user = user("user@example.com");
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(bookingRepository.findByUserOrderByCreatedAtDesc(eq(user), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), org.springframework.data.domain.PageRequest.of(0, 5), 0));

        PageBookingResponse response = bookingService.getMyBookings("user@example.com", -4, 99);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(bookingRepository).findByUserOrderByCreatedAtDesc(eq(user), pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageNumber()).isZero();
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(5);
        assertThat(response.page()).isZero();
        assertThat(response.size()).isEqualTo(5);
    }

    @Test
    void controllerReturnsPaginatedMyBookingsResponse() {
        User user = user("user@example.com");
        Booking booking = booking(user, "hold-123");
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(bookingRepository.findByUserOrderByCreatedAtDesc(eq(user), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(booking), org.springframework.data.domain.PageRequest.of(0, 5), 1));
        com.asms.booking.controller.BookingController controller = new com.asms.booking.controller.BookingController(bookingService);

        ApiResponse<PageBookingResponse> response = controller.getMyBookings(user, 0, 20);

        assertThat(response.success()).isTrue();
        assertThat(response.data().items()).hasSize(1);
        assertThat(response.data().size()).isEqualTo(5);
    }

    @Test
    void getBookingDetailReturnsOwnedBooking() {
        User user = user("user@example.com");
        Booking booking = booking(user, "hold-123");
        UUID bookingId = booking.getId();
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(bookingRepository.findByIdAndUser(bookingId, user)).thenReturn(Optional.of(booking));

        BookingResponse response = bookingService.getBookingDetail(bookingId, "user@example.com");

        assertThat(response.id()).isEqualTo(bookingId);
        assertThat(response.holdId()).isEqualTo("hold-123");
        assertThat(response.bookingCode()).isEqualTo("AQB20260531ABC123");
        assertThat(response.showName()).isEqualTo("Symphony of Lights");
        assertThat(response.showDate()).isEqualTo(booking.getShowDate());
        assertThat(response.ticketType()).isEqualTo("STANDARD");
        assertThat(response.quantity()).isEqualTo(2);
        assertThat(response.unitPrice()).isEqualByComparingTo("45.00");
        assertThat(response.totalAmount()).isEqualByComparingTo("90.00");
        assertThat(response.status()).isEqualTo(BookingStatus.PENDING_PAYMENT);
        assertThat(response.expiresAt()).isEqualTo(booking.getExpiresAt());
    }

    @Test
    void getBookingDetailDoesNotReturnAnotherUsersBooking() {
        User user = user("user@example.com");
        UUID bookingId = UUID.randomUUID();
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(bookingRepository.findByIdAndUser(bookingId, user)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.getBookingDetail(bookingId, "user@example.com"))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void getBookingDetailConvertsExpiredPendingBookingToExpired() {
        User user = user("user@example.com");
        Booking booking = booking(user, "hold-expired");
        booking.setExpiresAt(Instant.now().minusSeconds(60));
        UUID bookingId = booking.getId();
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(bookingRepository.findByIdAndUser(bookingId, user)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BookingResponse response = bookingService.getBookingDetail(bookingId, "user@example.com");

        assertThat(response.status()).isEqualTo(BookingStatus.EXPIRED);
        verify(bookingRepository).save(booking);
    }

    @Test
    void getBookingDetailReturnsPaidFailedAndExpiredStatusesUnchanged() {
        User user = user("user@example.com");
        Booking paidBooking = booking(user, "hold-paid");
        paidBooking.setStatus(BookingStatus.PAID);
        Booking failedBooking = booking(user, "hold-failed");
        failedBooking.setStatus(BookingStatus.FAILED);
        failedBooking.setExpiresAt(Instant.now().minusSeconds(60));
        Booking expiredBooking = booking(user, "hold-expired-status");
        expiredBooking.setStatus(BookingStatus.EXPIRED);
        expiredBooking.setExpiresAt(Instant.now().minusSeconds(60));
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(bookingRepository.findByIdAndUser(paidBooking.getId(), user)).thenReturn(Optional.of(paidBooking));
        when(bookingRepository.findByIdAndUser(failedBooking.getId(), user)).thenReturn(Optional.of(failedBooking));
        when(bookingRepository.findByIdAndUser(expiredBooking.getId(), user)).thenReturn(Optional.of(expiredBooking));

        BookingResponse paidResponse = bookingService.getBookingDetail(paidBooking.getId(), "user@example.com");
        BookingResponse failedResponse = bookingService.getBookingDetail(failedBooking.getId(), "user@example.com");
        BookingResponse expiredResponse = bookingService.getBookingDetail(expiredBooking.getId(), "user@example.com");

        assertThat(paidResponse.status()).isEqualTo(BookingStatus.PAID);
        assertThat(failedResponse.status()).isEqualTo(BookingStatus.FAILED);
        assertThat(expiredResponse.status()).isEqualTo(BookingStatus.EXPIRED);
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void getBookingByHoldIdReturnsOwnedBookingOnly() {
        User user = user("user@example.com");
        Booking booking = booking(user, "hold-123");
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(bookingRepository.findByHoldId("hold-123")).thenReturn(Optional.of(booking));

        BookingResponse response = bookingService.getBookingByHoldId("hold-123", "user@example.com");

        assertThat(response.holdId()).isEqualTo("hold-123");
    }

    @Test
    void controllerRejectsUnauthenticatedCreateBooking() {
        com.asms.booking.controller.BookingController controller = new com.asms.booking.controller.BookingController(bookingService);

        assertThatThrownBy(() -> controller.createBooking(null, validRequest("STANDARD", 1)))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void controllerReturnsApiResponseForCreateBooking() {
        User user = user("user@example.com");
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(redisTicketHoldService.holdTickets("schedule-1", "STANDARD", 1, user.getId()))
                .thenReturn(new HoldResult(true, "hold-123", "held", Instant.parse("2026-05-31T15:15:00Z")));
        com.asms.booking.controller.BookingController controller = new com.asms.booking.controller.BookingController(bookingService);

        ApiResponse<CreateBookingResponse> response = controller.createBooking(user, validRequest("STANDARD", 1));

        assertThat(response.success()).isTrue();
        assertThat(response.data().status()).isEqualTo(BookingStatus.PROCESSING);
    }

    private CreateBookingRequest validRequest(String ticketType, int quantity) {
        return new CreateBookingRequest(
                "show-1",
                "schedule-1",
                "Symphony of Lights",
                LocalDate.now().plusDays(1),
                ticketType,
                quantity
        );
    }

    private User user(String email) {
        return new User("Nguyen", "Van A", email, "0909123456", "hashed");
    }

    private Booking booking(User user, String holdId) {
        return booking(user, holdId, "AQB20260531ABC123");
    }

    private Booking booking(User user, String holdId, String bookingCode) {
        Booking booking = Booking.create();
        booking.setUser(user);
        booking.setBookingCode(bookingCode);
        booking.setHoldId(holdId);
        booking.setShowId("show-1");
        booking.setScheduleId("schedule-1");
        booking.setShowName("Symphony of Lights");
        booking.setShowDate(LocalDate.now().plusDays(1));
        booking.setTicketType("STANDARD");
        booking.setQuantity(2);
        booking.setUnitPrice(new BigDecimal("45.00"));
        booking.setTotalAmount(new BigDecimal("90.00"));
        booking.setStatus(BookingStatus.PENDING_PAYMENT);
        booking.setExpiresAt(Instant.now().plusSeconds(900));
        setId(booking, UUID.randomUUID());
        return booking;
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
