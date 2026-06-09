package com.asms.booking.service.impl;

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
import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.enums.ScheduleStatus;
import com.asms.catalog.repository.ShowScheduleRepository;
import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.ConflictException;
import com.asms.core.exception.NotFoundException;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class BookingServiceImpl implements BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingServiceImpl.class);
    private static final BigDecimal STANDARD_PRICE = new BigDecimal("2000");
    private static final BigDecimal VIP_PRICE = new BigDecimal("5000");
    private static final BigDecimal FAMILY_PRICE = new BigDecimal("3000");
    private static final int MAX_TICKETS_PER_BOOKING = 10;
    private static final long BOOKING_CUTOFF_MINUTES = 30;
    private static final int DEFAULT_MY_BOOKINGS_PAGE_SIZE = 5;
    private static final int MAX_MY_BOOKINGS_PAGE_SIZE = 5;
    private static final DateTimeFormatter BOOKING_CODE_DATE_FORMAT = DateTimeFormatter.BASIC_ISO_DATE;

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ShowScheduleRepository scheduleRepository;
    private final RedisTicketHoldService redisTicketHoldService;
    private final RabbitMQBookingPublisher bookingPublisher;
    private final PaymentRepository paymentRepository;
    private final TicketRepository ticketRepository;
    private final EmailNotificationRepository emailNotificationRepository;
    private final String frontendBaseUrl;

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            UserRepository userRepository,
            ShowScheduleRepository scheduleRepository,
            RedisTicketHoldService redisTicketHoldService,
            RabbitMQBookingPublisher bookingPublisher,
            PaymentRepository paymentRepository,
            TicketRepository ticketRepository,
            EmailNotificationRepository emailNotificationRepository,
            @Value("${asms.frontend.base-url}") String frontendBaseUrl
    ) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.scheduleRepository = scheduleRepository;
        this.redisTicketHoldService = redisTicketHoldService;
        this.bookingPublisher = bookingPublisher;
        this.paymentRepository = paymentRepository;
        this.ticketRepository = ticketRepository;
        this.emailNotificationRepository = emailNotificationRepository;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Override
    @Transactional
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
        int quantity = validateQuantity(request.quantity());
        String ticketType = normalizeTicketType(request.ticketType());
        validateTicketType(ticketType);
        ShowSchedule schedule = resolveBookableSchedule(request);
        Instant now = Instant.now();
        BigDecimal unitPrice = priceFor(ticketType).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = unitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
        int availableTickets = calculateAvailableTickets(schedule, now);
        if (availableTickets < quantity) {
            throw new ConflictException("Not enough tickets available.");
        }
        log.info(
                "Calculated booking price: ticketType={}, unitPrice={}, quantity={}, totalAmount={}",
                ticketType,
                unitPrice,
                quantity,
                totalAmount
        );

        redisTicketHoldService.initializeInventory(schedule.getId().toString(), ticketType, availableTickets);
        HoldResult hold = redisTicketHoldService.holdTickets(
                schedule.getId().toString(),
                ticketType,
                quantity,
                user.getId()
        );
        if (!hold.success()) {
            log.warn(
                    "Redis ticket hold rejected for booking request: userEmail={}, scheduleId={}, ticketType={}, quantity={}",
                    user.getEmail(),
                    schedule.getId(),
                    ticketType,
                    quantity
            );
            throw new ConflictException("Not enough tickets available.");
        }
        log.info(
                "Redis ticket hold succeeded for booking request: holdId={}, userEmail={}, scheduleId={}, ticketType={}, quantity={}, expiresAt={}",
                hold.holdId(),
                user.getEmail(),
                schedule.getId(),
                ticketType,
                quantity,
                hold.expiresAt()
        );
        releaseHoldIfTransactionRollsBack(hold.holdId());

        UUID requestId = UUID.randomUUID();
        Booking booking = Booking.create();
        booking.setUser(user);
        booking.setBookingCode(generateProductionBookingCode());
        booking.setHoldId(hold.holdId());
        booking.setShowId(schedule.getShow().getId().toString());
        booking.setScheduleId(schedule.getId().toString());
        booking.setShowName(schedule.getShow().getTitle());
        booking.setShowDate(schedule.getStartTime().toLocalDate());
        booking.setTicketType(ticketType);
        booking.setQuantity(quantity);
        booking.setUnitPrice(unitPrice);
        booking.setTotalAmount(totalAmount);
        booking.setStatus(BookingStatus.PENDING_PAYMENT);
        booking.setExpiresAt(hold.expiresAt());
        try {
            booking = bookingRepository.save(booking);
        } catch (RuntimeException exception) {
            log.error(
                    "Booking persistence failed after Redis hold. Releasing hold: requestId={}, holdId={}, userEmail={}",
                    requestId,
                    hold.holdId(),
                    user.getEmail(),
                    exception
            );
            redisTicketHoldService.releaseHold(hold.holdId());
            log.error(
                    "Redis hold released after booking persistence failure: requestId={}, holdId={}, userEmail={}",
                    requestId,
                    hold.holdId(),
                    user.getEmail()
            );
            throw exception;
        }

        return new CreateBookingResponse(
                requestId,
                booking.getId(),
                hold.holdId(),
                BookingStatus.PENDING_PAYMENT,
                "Booking created and awaiting payment.",
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
        booking.setBookingCode(generateDevBookingCode());
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
        if (normalized.equals("VIP EXPERIENCE")) {
            return "VIP";
        }
        if (normalized.equals("FAMILY PACKAGE")) {
            return "FAMILY";
        }
        if (normalized.equals("FAMILY PASS")) {
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

    private void validateTicketType(String ticketType) {
        priceFor(ticketType);
    }

    private int validateQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new BadRequestException("Quantity must be at least 1");
        }
        if (quantity > MAX_TICKETS_PER_BOOKING) {
            throw new BadRequestException("Quantity must not exceed 10");
        }
        return quantity;
    }

    private ShowSchedule resolveBookableSchedule(CreateBookingRequest request) {
        UUID scheduleId = parseUuid(request.scheduleId(), "Schedule ID is invalid");
        ShowSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new NotFoundException("Schedule not found"));

        if (schedule.getStatus() != ScheduleStatus.ACTIVE) {
            throw new BadRequestException("Schedule is not bookable");
        }
        Instant startsAt = schedule.getStartTime().atZone(java.time.ZoneId.systemDefault()).toInstant();
        if (!startsAt.isAfter(Instant.now().plusSeconds(BOOKING_CUTOFF_MINUTES * 60))) {
            throw new BadRequestException("Bookings must be created at least 30 minutes before show start");
        }
        if (request.showId() != null && !request.showId().isBlank()) {
            UUID requestedShowId = parseUuid(request.showId(), "Show ID is invalid");
            if (!schedule.getShow().getId().equals(requestedShowId)) {
                throw new BadRequestException("Schedule does not belong to requested show");
            }
        }
        return schedule;
    }

    private UUID parseUuid(String value, String message) {
        try {
            return UUID.fromString(value);
        } catch (RuntimeException exception) {
            throw new BadRequestException(message);
        }
    }

    private int calculateAvailableTickets(ShowSchedule schedule, Instant now) {
        String scheduleId = schedule.getId().toString();
        long paidQuantity = bookingRepository.countPaidTicketsByScheduleId(scheduleId);
        long pendingQuantity = bookingRepository.countNonExpiredPendingTicketsByScheduleId(scheduleId, now);
        long available = (long) schedule.getCapacity() - paidQuantity - pendingQuantity;
        if (available > Integer.MAX_VALUE) {
            return Integer.MAX_VALUE;
        }
        return (int) Math.max(available, 0);
    }

    private void releaseHoldIfTransactionRollsBack(String holdId) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) {
                    redisTicketHoldService.releaseHold(holdId);
                }
            }
        });
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

    private String generateProductionBookingCode() {
        String bookingCode;
        do {
            bookingCode = "AQB" + LocalDate.now().format(BOOKING_CODE_DATE_FORMAT) + randomSuffix();
        } while (bookingRepository.existsByBookingCode(bookingCode));
        return bookingCode;
    }

    private String generateDevBookingCode() {
        String bookingCode;
        do {
            bookingCode = "AQBDEV" + Instant.now().toEpochMilli() + ThreadLocalRandom.current().nextInt(100, 999);
        } while (bookingRepository.existsByBookingCode(bookingCode));
        return bookingCode;
    }

    private String randomSuffix() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase(Locale.ROOT);
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
