package com.asms.booking.service.impl;

import com.asms.booking.dto.BookingDtos.BookingMessage;
import com.asms.booking.dto.BookingDtos.BookingResponse;
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
import com.asms.core.exception.ServiceUnavailableException;
import com.asms.core.exception.UnauthorizedException;
import com.asms.identity.entity.User;
import com.asms.identity.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class BookingServiceImpl implements BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingServiceImpl.class);
    private static final BigDecimal STANDARD_PRICE = new BigDecimal("45.00");
    private static final BigDecimal VIP_PRICE = new BigDecimal("70.00");
    private static final BigDecimal FAMILY_PRICE = new BigDecimal("36.00");
    private static final int DEFAULT_MY_BOOKINGS_PAGE_SIZE = 5;
    private static final int MAX_MY_BOOKINGS_PAGE_SIZE = 5;

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RedisTicketHoldService redisTicketHoldService;
    private final RabbitMQBookingPublisher bookingPublisher;

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            UserRepository userRepository,
            RedisTicketHoldService redisTicketHoldService,
            RabbitMQBookingPublisher bookingPublisher
    ) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.redisTicketHoldService = redisTicketHoldService;
        this.bookingPublisher = bookingPublisher;
    }

    @Override
    public CreateBookingResponse createBooking(CreateBookingRequest request, String currentUserEmail) {
        log.info(
                "Create booking request received: userEmail={}, showId={}, scheduleId={}, ticketType={}, quantity={}",
                currentUserEmail,
                request.showId(),
                request.scheduleId(),
                request.ticketType(),
                request.quantity()
        );
        User user = resolveUser(currentUserEmail);
        String ticketType = normalizeTicketType(request.ticketType());
        BigDecimal unitPrice = priceFor(ticketType);
        BigDecimal totalAmount = unitPrice.multiply(BigDecimal.valueOf(request.quantity()));
        log.info(
                "Calculated booking price: ticketType={}, unitPrice={}, quantity={}, totalAmount={}",
                ticketType,
                unitPrice,
                request.quantity(),
                totalAmount
        );

        // TODO: Validate schedule existence after ShowSchedule module exists.
        // TODO: Validate booking deadline after Schedule module exists.
        // TODO: Validate real inventory after TicketInventory module exists.
        HoldResult hold = redisTicketHoldService.holdTickets(
                request.scheduleId(),
                ticketType,
                request.quantity(),
                user.getId()
        );
        if (!hold.success()) {
            log.warn(
                    "Redis ticket hold rejected for booking request: userEmail={}, scheduleId={}, ticketType={}, quantity={}",
                    user.getEmail(),
                    request.scheduleId(),
                    ticketType,
                    request.quantity()
            );
            throw new ConflictException("Not enough tickets available.");
        }
        log.info(
                "Redis ticket hold succeeded for booking request: holdId={}, userEmail={}, scheduleId={}, ticketType={}, quantity={}, expiresAt={}",
                hold.holdId(),
                user.getEmail(),
                request.scheduleId(),
                ticketType,
                request.quantity(),
                hold.expiresAt()
        );

        UUID requestId = UUID.randomUUID();
        BookingMessage message = new BookingMessage(
                requestId,
                hold.holdId(),
                user.getId(),
                user.getEmail(),
                request.showId(),
                request.scheduleId(),
                request.showName(),
                request.showDate(),
                ticketType,
                request.quantity(),
                unitPrice,
                totalAmount,
                hold.expiresAt(),
                Instant.now()
        );

        try {
            bookingPublisher.publishCreateBooking(message);
        } catch (RuntimeException exception) {
            log.error(
                    "RabbitMQ publish failed after Redis hold. Releasing hold: requestId={}, holdId={}, userEmail={}",
                    requestId,
                    hold.holdId(),
                    user.getEmail(),
                    exception
            );
            redisTicketHoldService.releaseHold(hold.holdId());
            log.error(
                    "Redis hold released after RabbitMQ publish failure: requestId={}, holdId={}, userEmail={}",
                    requestId,
                    hold.holdId(),
                    user.getEmail()
            );
            throw new ServiceUnavailableException("Booking service is temporarily unavailable");
        }

        return new CreateBookingResponse(
                requestId,
                hold.holdId(),
                BookingStatus.PROCESSING,
                "Booking request is being processed.",
                hold.expiresAt()
        );
    }

    @Override
    public PageBookingResponse getMyBookings(String currentUserEmail, int page, int size) {
        User user = resolveUser(currentUserEmail);
        int safePage = Math.max(page, 0);
        int safeSize = sanitizeMyBookingsPageSize(size);
        Page<Booking> bookingPage = bookingRepository.findByUserOrderByCreatedAtDesc(user, PageRequest.of(safePage, safeSize));
        List<BookingResponse> items = bookingPage.getContent()
                .stream()
                .map(this::expirePendingBookingIfNeeded)
                .map(this::toResponse)
                .toList();

        return new PageBookingResponse(
                items,
                bookingPage.getNumber(),
                bookingPage.getSize(),
                bookingPage.getTotalElements(),
                bookingPage.getTotalPages(),
                bookingPage.hasNext(),
                bookingPage.hasPrevious()
        );
    }

    @Override
    public BookingResponse getBookingDetail(UUID id, String currentUserEmail) {
        User user = resolveUser(currentUserEmail);
        return bookingRepository.findByIdAndUser(id, user)
                .map(this::expirePendingBookingIfNeeded)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
    }

    @Override
    public BookingResponse getBookingByHoldId(String holdId, String currentUserEmail) {
        User user = resolveUser(currentUserEmail);
        Booking booking = bookingRepository.findByHoldId(holdId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        if (!booking.getUser().getId().equals(user.getId())) {
            throw new NotFoundException("Booking not found");
        }
        return toResponse(expirePendingBookingIfNeeded(booking));
    }

    private User resolveUser(String currentUserEmail) {
        if (currentUserEmail == null || currentUserEmail.isBlank()) {
            throw new UnauthorizedException("Authentication required");
        }
        return userRepository.findByEmailIgnoreCase(currentUserEmail)
                .orElseThrow(() -> new UnauthorizedException("Authentication required"));
    }

    private BigDecimal priceFor(String ticketType) {
        return switch (ticketType) {
            case "STANDARD" -> STANDARD_PRICE;
            case "VIP" -> VIP_PRICE;
            case "FAMILY" -> FAMILY_PRICE;
            default -> throw new BadRequestException("Unknown ticket type");
        };
    }

    private String normalizeTicketType(String ticketType) {
        if (ticketType == null) {
            return "";
        }
        String normalized = ticketType.trim().toUpperCase(Locale.ROOT)
                .replace("_", " ")
                .replace("-", " ");
        if (normalized.equals("STANDARD ENTRY")) {
            return "STANDARD";
        }
        if (normalized.equals("VIP ENTRY")) {
            return "VIP";
        }
        if (normalized.equals("FAMILY PACKAGE")) {
            return "FAMILY";
        }
        return normalized;
    }

    private BookingResponse toResponse(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getHoldId(),
                booking.getShowId(),
                booking.getScheduleId(),
                booking.getShowName(),
                booking.getShowDate(),
                booking.getTicketType(),
                booking.getQuantity(),
                booking.getUnitPrice(),
                booking.getTotalAmount(),
                booking.getStatus(),
                booking.getCreatedAt(),
                booking.getExpiresAt()
        );
    }

    private Booking expirePendingBookingIfNeeded(Booking booking) {
        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT || booking.getExpiresAt() == null) {
            return booking;
        }

        if (booking.getExpiresAt().isAfter(Instant.now())) {
            return booking;
        }

        booking.setStatus(BookingStatus.EXPIRED);
        // TODO: Future scheduled job should expire old bookings and release Redis holds.
        return bookingRepository.save(booking);
    }

    private int sanitizeMyBookingsPageSize(int size) {
        if (size <= 0) {
            return DEFAULT_MY_BOOKINGS_PAGE_SIZE;
        }
        return Math.min(size, MAX_MY_BOOKINGS_PAGE_SIZE);
    }
}
