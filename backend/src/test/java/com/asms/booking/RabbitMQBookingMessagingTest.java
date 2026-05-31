package com.asms.booking;

import com.asms.booking.dto.BookingDtos.BookingMessage;
import com.asms.booking.entity.Booking;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.repository.BookingRepository;
import com.asms.booking.service.RedisTicketHoldService;
import com.asms.identity.entity.User;
import com.asms.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RabbitMQBookingMessagingTest {

    private static final String EXCHANGE = "asms.booking.exchange";
    private static final String ROUTING_KEY = "booking.create";

    private RabbitTemplate rabbitTemplate;
    private BookingRepository bookingRepository;
    private UserRepository userRepository;
    private RedisTicketHoldService redisTicketHoldService;

    @BeforeEach
    void setUp() {
        rabbitTemplate = mock(RabbitTemplate.class);
        bookingRepository = mock(BookingRepository.class);
        userRepository = mock(UserRepository.class);
        redisTicketHoldService = mock(RedisTicketHoldService.class);
    }

    @Test
    void publisherSendsCreateBookingMessageToConfiguredExchange() throws Exception {
        Object publisher = newPublisher(rabbitTemplate);
        BookingMessage message = bookingMessage("hold-123");

        invoke(publisher, "publishCreateBooking", new Class<?>[]{BookingMessage.class}, message);

        verify(rabbitTemplate).convertAndSend(EXCHANGE, ROUTING_KEY, message);
    }

    @Test
    void consumerSavesPendingPaymentBookingWhenHoldIsValid() throws Exception {
        Object consumer = newConsumer();
        BookingMessage message = bookingMessage("hold-123");
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "hashed");
        when(redisTicketHoldService.isHoldValid("hold-123")).thenReturn(true);
        when(bookingRepository.findByHoldId("hold-123")).thenReturn(Optional.empty());
        when(userRepository.findById(message.userId())).thenReturn(Optional.of(user));
        when(bookingRepository.existsByBookingCode(any())).thenReturn(false);

        invoke(consumer, "consumeCreateBooking", new Class<?>[]{BookingMessage.class}, message);

        ArgumentCaptor<Booking> bookingCaptor = ArgumentCaptor.forClass(Booking.class);
        verify(bookingRepository).save(bookingCaptor.capture());
        Booking booking = bookingCaptor.getValue();
        assertThat(booking.getUser()).isSameAs(user);
        assertThat(booking.getHoldId()).isEqualTo("hold-123");
        assertThat(booking.getShowId()).isEqualTo("show-1");
        assertThat(booking.getScheduleId()).isEqualTo("schedule-1");
        assertThat(booking.getStatus()).isEqualTo(BookingStatus.PENDING_PAYMENT);
        assertThat(booking.getExpiresAt()).isEqualTo(message.expiresAt());
        assertThat(booking.getBookingCode()).startsWith("AQB" + LocalDate.now().format(java.time.format.DateTimeFormatter.BASIC_ISO_DATE));
        assertThat(booking.getBookingCode()).hasSize(17);
    }

    @Test
    void consumerDoesNotSaveBookingWhenHoldIsExpired() throws Exception {
        Object consumer = newConsumer();
        BookingMessage message = bookingMessage("expired-hold");
        when(redisTicketHoldService.isHoldValid("expired-hold")).thenReturn(false);

        invoke(consumer, "consumeCreateBooking", new Class<?>[]{BookingMessage.class}, message);

        verify(bookingRepository, never()).save(any());
    }

    @Test
    void consumerDoesNotDuplicateBookingForSameHoldId() throws Exception {
        Object consumer = newConsumer();
        BookingMessage message = bookingMessage("hold-123");
        when(redisTicketHoldService.isHoldValid("hold-123")).thenReturn(true);
        when(bookingRepository.findByHoldId("hold-123")).thenReturn(Optional.of(mock(Booking.class)));

        invoke(consumer, "consumeCreateBooking", new Class<?>[]{BookingMessage.class}, message);

        verify(bookingRepository, never()).save(any());
    }

    @Test
    void consumerRetriesBookingCodeGenerationUntilUnique() throws Exception {
        Object consumer = newConsumer();
        BookingMessage message = bookingMessage("hold-123");
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "hashed");
        when(redisTicketHoldService.isHoldValid("hold-123")).thenReturn(true);
        when(bookingRepository.findByHoldId("hold-123")).thenReturn(Optional.empty());
        when(userRepository.findById(message.userId())).thenReturn(Optional.of(user));
        when(bookingRepository.existsByBookingCode(any())).thenReturn(true, false);

        invoke(consumer, "consumeCreateBooking", new Class<?>[]{BookingMessage.class}, message);

        verify(bookingRepository).save(any(Booking.class));
        verify(bookingRepository, org.mockito.Mockito.atLeast(2)).existsByBookingCode(any());
    }

    private Object newPublisher(RabbitTemplate rabbitTemplate) throws Exception {
        Constructor<?> constructor = Class.forName("com.asms.booking.messaging.RabbitMQBookingPublisher")
                .getConstructor(RabbitTemplate.class);
        return constructor.newInstance(rabbitTemplate);
    }

    private Object newConsumer() throws Exception {
        Constructor<?> constructor = Class.forName("com.asms.booking.messaging.BookingConsumer")
                .getConstructor(BookingRepository.class, UserRepository.class, RedisTicketHoldService.class);
        return constructor.newInstance(bookingRepository, userRepository, redisTicketHoldService);
    }

    private BookingMessage bookingMessage(String holdId) {
        return new BookingMessage(
                UUID.randomUUID(),
                holdId,
                UUID.randomUUID(),
                "user@example.com",
                "show-1",
                "schedule-1",
                "Symphony of Lights",
                LocalDate.now().plusDays(1),
                "Standard Entry",
                2,
                new BigDecimal("150000.00"),
                new BigDecimal("300000.00"),
                Instant.parse("2026-05-31T15:15:00Z"),
                Instant.parse("2026-05-31T15:00:00Z")
        );
    }

    private Object invoke(Object target, String methodName, Class<?>[] parameterTypes, Object... values) throws Exception {
        Method method = target.getClass().getMethod(methodName, parameterTypes);
        return method.invoke(target, values);
    }
}
