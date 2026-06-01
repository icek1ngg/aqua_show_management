package com.asms.booking.service.impl;

import com.asms.booking.dto.BookingDtos.BookingMessage;
import com.asms.booking.dto.BookingDtos.BookingResponse;
import com.asms.booking.dto.BookingDtos.CreateBookingRequest;
import com.asms.booking.dto.BookingDtos.CreateBookingResponse;
import com.asms.booking.dto.BookingDtos.DevSampleBookingBatchRequest;
import com.asms.booking.dto.BookingDtos.DevSampleBookingRequest;
import com.asms.booking.dto.BookingDtos.DevSampleBookingResponse;
import com.asms.booking.dto.BookingDtos.EmailNotificationSummary;
import com.asms.booking.dto.BookingDtos.PageBookingResponse;
import com.asms.booking.dto.BookingDtos.PaymentSummary;
import com.asms.booking.dto.BookingDtos.TicketDetail;
import com.asms.booking.dto.BookingDtos.TicketSummary;
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
import com.asms.notification.entity.EmailNotification;
import com.asms.notification.repository.EmailNotificationRepository;
import com.asms.payment.entity.Payment;
import com.asms.payment.repository.PaymentRepository;
import com.asms.ticketing.entity.Ticket;
import com.asms.ticketing.enums.TicketStatus;
import com.asms.ticketing.repository.TicketRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

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
    private final PaymentRepository paymentRepository;
    private final TicketRepository ticketRepository;
    private final EmailNotificationRepository emailNotificationRepository;
    private final String frontendBaseUrl;

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            UserRepository userRepository,
            RedisTicketHoldService redisTicketHoldService,
            RabbitMQBookingPublisher bookingPublisher,
            PaymentRepository paymentRepository,
            TicketRepository ticketRepository,
            EmailNotificationRepository emailNotificationRepository,
            @Value("${asms.frontend.base-url}") String frontendBaseUrl
    ) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.redisTicketHoldService = redisTicketHoldService;
        this.bookingPublisher = bookingPublisher;
        this.paymentRepository = paymentRepository;
        this.ticketRepository = ticketRepository;
        this.emailNotificationRepository = emailNotificationRepository;
        this.frontendBaseUrl = frontendBaseUrl;
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

    @Override
    public DevSampleBookingResponse createDevSampleBooking(DevSampleBookingRequest request, String currentUserEmail) {
        User user = resolveUser(currentUserEmail);
        BigDecimal amount = sanitizeAmount(request.amount());
        int quantity = request.quantity() == null ? 1 : request.quantity();
        int expiresInMinutes = request.expiresInMinutes() == null ? 60 : request.expiresInMinutes();

        Booking booking = Booking.create();
        booking.setUser(user);
        booking.setBookingCode(generateBookingCode());
        booking.setHoldId("ASMS-DEV-HOLD-" + UUID.randomUUID());
        booking.setShowId("SHOW-DEMO-AQUA");
        booking.setScheduleId("SCHEDULE-DEMO-AQUA");
        booking.setShowName("Midnight Aqua Symphony");
        booking.setShowDate(java.time.LocalDate.now().plusDays(7));
        booking.setTicketType("STANDARD");
        booking.setQuantity(quantity);
        booking.setTotalAmount(amount);
        booking.setUnitPrice(amount.divide(BigDecimal.valueOf(quantity), 2, RoundingMode.HALF_UP));
        booking.setStatus(BookingStatus.PENDING_PAYMENT);
        booking.setExpiresAt(Instant.now().plusSeconds(expiresInMinutes * 60L));

        return toDevSampleResponse(bookingRepository.save(booking));
    }

    @Override
    public List<DevSampleBookingResponse> createDevSampleBookings(DevSampleBookingBatchRequest request, String currentUserEmail) {
        if (request.amounts() == null || request.amounts().isEmpty()) {
            throw new BadRequestException("At least one amount is required");
        }
        if (request.amounts().size() > 20) {
            throw new BadRequestException("Cannot create more than 20 sample bookings at once");
        }

        return request.amounts()
                .stream()
                .map((amount) -> createDevSampleBooking(new DevSampleBookingRequest(amount, 1, request.expiresInMinutes()), currentUserEmail))
                .toList();
    }

    @Override
    public List<DevSampleBookingResponse> getMyPendingDevSampleBookings(String currentUserEmail) {
        User user = resolveUser(currentUserEmail);
        return bookingRepository.findByUserAndStatusOrderByCreatedAtDesc(user, BookingStatus.PENDING_PAYMENT)
                .stream()
                .map(this::expirePendingBookingIfNeeded)
                .filter((booking) -> booking.getStatus() == BookingStatus.PENDING_PAYMENT)
                .map(this::toDevSampleResponse)
                .toList();
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
                booking.getExpiresAt(),
                toPaymentSummary(booking),
                toTicketSummary(booking),
                toEmailNotificationSummary(booking)
        );
    }

    private DevSampleBookingResponse toDevSampleResponse(Booking booking) {
        String frontendUrl = frontendBaseUrl == null || frontendBaseUrl.isBlank()
                ? "http://localhost:5173"
                : frontendBaseUrl.replaceAll("/+$", "");

        return new DevSampleBookingResponse(
                toResponse(booking),
                frontendUrl + "/bookings/" + booking.getId() + "/payment",
                "POST /api/payments/create { \"bookingId\": \"" + booking.getId() + "\" }"
        );
    }

    private BigDecimal sanitizeAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Amount must be positive");
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private String generateBookingCode() {
        String bookingCode;
        do {
            bookingCode = "AQBDEV" + Instant.now().toEpochMilli() + ThreadLocalRandom.current().nextInt(100, 999);
        } while (bookingRepository.existsByBookingCode(bookingCode));
        return bookingCode;
    }

    private PaymentSummary toPaymentSummary(Booking booking) {
        return paymentRepository.findByBooking_Id(booking.getId())
                .map((Payment payment) -> new PaymentSummary(
                        payment.getId(),
                        payment.getPayosOrderCode(),
                        payment.getTransactionId(),
                        payment.getAmount(),
                        payment.getStatus(),
                        payment.getPaidAt(),
                        payment.getCreatedAt()
                ))
                .orElse(null);
    }

    private TicketSummary toTicketSummary(Booking booking) {
        List<Ticket> tickets = ticketRepository.findByBooking_Id(booking.getId());
        if (tickets.isEmpty()) {
            return new TicketSummary(0, 0, 0, 0, List.of());
        }

        int valid = (int) tickets.stream().filter((ticket) -> ticket.getStatus() == TicketStatus.VALID).count();
        int used = (int) tickets.stream().filter((ticket) -> ticket.getStatus() == TicketStatus.USED).count();
        int expired = (int) tickets.stream().filter((ticket) -> ticket.getStatus() == TicketStatus.EXPIRED).count();
        List<TicketDetail> items = tickets.stream()
                .map((Ticket ticket) -> new TicketDetail(
                        ticket.getId(),
                        ticket.getQrCode(),
                        ticket.getStatus(),
                        ticket.getIssuedAt(),
                        ticket.getUsedAt()
                ))
                .toList();

        return new TicketSummary(tickets.size(), valid, used, expired, items);
    }

    private EmailNotificationSummary toEmailNotificationSummary(Booking booking) {
        return emailNotificationRepository.findTopByBooking_IdOrderByCreatedAtDesc(booking.getId())
                .map((EmailNotification notification) -> new EmailNotificationSummary(
                        notification.getId(),
                        notification.getEmailType(),
                        notification.getStatus(),
                        notification.getSentAt(),
                        notification.getCreatedAt()
                ))
                .orElse(null);
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
