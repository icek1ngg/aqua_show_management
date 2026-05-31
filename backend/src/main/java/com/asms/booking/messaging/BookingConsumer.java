package com.asms.booking.messaging;

import com.asms.booking.config.BookingRabbitConfig;
import com.asms.booking.dto.BookingDtos.BookingMessage;
import com.asms.booking.entity.Booking;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.repository.BookingRepository;
import com.asms.booking.service.RedisTicketHoldService;
import com.asms.identity.entity.User;
import com.asms.identity.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Component
public class BookingConsumer {

    private static final Logger log = LoggerFactory.getLogger(BookingConsumer.class);
    private static final DateTimeFormatter BOOKING_CODE_DATE_FORMAT = DateTimeFormatter.BASIC_ISO_DATE;
    private static final char[] BOOKING_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".toCharArray();
    private static final int BOOKING_CODE_RANDOM_LENGTH = 6;
    private static final int BOOKING_CODE_MAX_ATTEMPTS = 20;

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RedisTicketHoldService redisTicketHoldService;
    private final SecureRandom secureRandom = new SecureRandom();

    public BookingConsumer(
            BookingRepository bookingRepository,
            UserRepository userRepository,
            RedisTicketHoldService redisTicketHoldService
    ) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.redisTicketHoldService = redisTicketHoldService;
    }

    @RabbitListener(queues = BookingRabbitConfig.BOOKING_CREATE_QUEUE)
    public void consumeCreateBooking(BookingMessage message) {
        log.info(
                "Received booking message: requestId={}, holdId={}, userId={}, userEmail={}, scheduleId={}, ticketType={}, quantity={}",
                message.requestId(),
                message.holdId(),
                message.userId(),
                message.userEmail(),
                message.scheduleId(),
                message.ticketType(),
                message.quantity()
        );

        try {
            if (!redisTicketHoldService.isHoldValid(message.holdId())) {
                log.warn(
                        "Booking message skipped because Redis hold is expired or missing: requestId={}, holdId={}",
                        message.requestId(),
                        message.holdId()
                );
                return;
            }

            Optional<Booking> existingBooking = bookingRepository.findByHoldId(message.holdId());
            if (existingBooking.isPresent()) {
                log.info(
                        "Booking message skipped because booking already exists for holdId={}: bookingId={}",
                        message.holdId(),
                        existingBooking.get().getId()
                );
                return;
            }

            Optional<User> user = userRepository.findById(message.userId());
            if (user.isEmpty()) {
                log.warn("Discarding booking create message because user was not found. userId={}", message.userId());
                return;
            }

            Booking booking = Booking.create();
            booking.setUser(user.get());
            booking.setBookingCode(generateUniqueBookingCode());
            booking.setHoldId(message.holdId());
            booking.setShowId(message.showId());
            booking.setScheduleId(message.scheduleId());
            booking.setShowName(message.showName());
            booking.setShowDate(message.showDate());
            booking.setTicketType(message.ticketType());
            booking.setQuantity(message.quantity());
            booking.setUnitPrice(message.unitPrice());
            booking.setTotalAmount(message.totalAmount());
            booking.setStatus(BookingStatus.PENDING_PAYMENT);
            booking.setExpiresAt(message.expiresAt());

            bookingRepository.save(booking);
            log.info(
                    "Booking created from queue: bookingId={}, bookingCode={}, holdId={}, status={}, totalAmount={}",
                    booking.getId(),
                    booking.getBookingCode(),
                    booking.getHoldId(),
                    booking.getStatus(),
                    booking.getTotalAmount()
            );
        } catch (RuntimeException exception) {
            log.error(
                    "Booking consumer failed: requestId={}, holdId={}",
                    message.requestId(),
                    message.holdId(),
                    exception
            );
            throw exception;
        }
    }

    private String generateUniqueBookingCode() {
        for (int attempt = 0; attempt < BOOKING_CODE_MAX_ATTEMPTS; attempt++) {
            String bookingCode = "AQB" + LocalDate.now().format(BOOKING_CODE_DATE_FORMAT) + randomSuffix();
            if (!bookingRepository.existsByBookingCode(bookingCode)) {
                return bookingCode;
            }
        }
        throw new IllegalStateException("Could not generate unique booking code");
    }

    private String randomSuffix() {
        StringBuilder builder = new StringBuilder(BOOKING_CODE_RANDOM_LENGTH);
        for (int i = 0; i < BOOKING_CODE_RANDOM_LENGTH; i++) {
            builder.append(BOOKING_CODE_CHARS[secureRandom.nextInt(BOOKING_CODE_CHARS.length)]);
        }
        return builder.toString();
    }
}
