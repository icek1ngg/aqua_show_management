package com.asms.booking.service.impl;

import com.asms.booking.BookingPolicy;
import com.asms.booking.dto.BookingDtos.BookingResponse;
import com.asms.booking.dto.BookingDtos.BookingItemResponse;
import com.asms.booking.dto.BookingDtos.CreateBookingItemRequest;
import com.asms.booking.dto.BookingDtos.CreateBookingRequest;
import com.asms.booking.dto.BookingDtos.CreateBookingResponse;
import com.asms.booking.dto.BookingDtos.EmailNotificationSummary;
import com.asms.booking.dto.BookingDtos.PageBookingResponse;
import com.asms.booking.dto.BookingDtos.BookingHistorySummary;
import com.asms.booking.dto.BookingDtos.PaymentSummary;
import com.asms.booking.dto.BookingDtos.TicketDetail;
import com.asms.booking.dto.BookingDtos.TicketSummary;
import com.asms.booking.dto.TicketHoldDtos.HoldResult;
import com.asms.booking.entity.Booking;
import com.asms.booking.entity.BookingItem;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.enums.PassengerType;
import com.asms.booking.enums.TicketType;
import com.asms.booking.repository.BookingRepository;
import com.asms.booking.service.BookingService;
import com.asms.booking.service.RedisTicketHoldService;
import com.asms.booking.service.TicketPricingService;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class BookingServiceImpl implements BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingServiceImpl.class);
    private static final long BOOKING_CUTOFF_MINUTES = 30;
    private static final int DEFAULT_MY_BOOKINGS_PAGE_SIZE = 5;
    private static final int MAX_MY_BOOKINGS_PAGE_SIZE = 5;
    private static final DateTimeFormatter BOOKING_CODE_DATE_FORMAT = DateTimeFormatter.BASIC_ISO_DATE;

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ShowScheduleRepository scheduleRepository;
    private final RedisTicketHoldService redisTicketHoldService;
    private final TicketPricingService ticketPricingService;
    private final PaymentRepository paymentRepository;
    private final TicketRepository ticketRepository;
    private final EmailNotificationRepository emailNotificationRepository;

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            UserRepository userRepository,
            ShowScheduleRepository scheduleRepository,
            RedisTicketHoldService redisTicketHoldService,
            TicketPricingService ticketPricingService,
            PaymentRepository paymentRepository,
            TicketRepository ticketRepository,
            EmailNotificationRepository emailNotificationRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.scheduleRepository = scheduleRepository;
        this.redisTicketHoldService = redisTicketHoldService;
        this.ticketPricingService = ticketPricingService;
        this.paymentRepository = paymentRepository;
        this.ticketRepository = ticketRepository;
        this.emailNotificationRepository = emailNotificationRepository;
    }

    @Override
    @Transactional
    public CreateBookingResponse createBooking(CreateBookingRequest request, String currentUserEmail) {
        User user = resolveUser(currentUserEmail);
        if (request == null || request.idempotencyKey() == null || request.idempotencyKey().isBlank()) {
            throw new BadRequestException("Idempotency key is required");
        }
        String idempotencyKey = request.idempotencyKey().trim();
        Booking previous = bookingRepository.findByUserAndIdempotencyKey(user, idempotencyKey).orElse(null);
        if (previous != null) {
            return toCreateBookingResponse(previous);
        }

        List<NormalizedLine> normalized = normalizeItems(request.items());
        List<ResolvedLine> lines = normalized.stream().map(this::resolveLine).toList();
        List<String> acquiredHoldIds = new ArrayList<>();
        AtomicBoolean compensated = new AtomicBoolean(false);
        registerHoldsRollback(acquiredHoldIds, compensated);

        try {
            List<HeldLine> heldLines = new ArrayList<>();
            for (ResolvedLine line : lines) {
                String scheduleId = line.schedule().getId().toString();
                int persistentAvailable = line.schedule().availableFor(line.ticketType());
                redisTicketHoldService.initializeInventory(scheduleId, line.ticketType(), persistentAvailable);
                HoldResult hold = redisTicketHoldService.holdTickets(
                        scheduleId, line.ticketType(), line.quantity(), user.getId());
                if (hold == null || !hold.success()) {
                    throw new ConflictException("Not enough tickets available.");
                }
                acquiredHoldIds.add(hold.holdId());
                heldLines.add(new HeldLine(line, hold));
            }

            Instant expiresAt = heldLines.stream()
                    .map(line -> line.hold().expiresAt())
                    .filter(java.util.Objects::nonNull)
                    .min(Instant::compareTo)
                    .orElseGet(() -> Instant.now().plusSeconds(15 * 60));
            Booking booking = Booking.create(user, generateProductionBookingCode(), expiresAt);
            booking.setIdempotencyKey(idempotencyKey);
            for (HeldLine heldLine : heldLines) {
                ResolvedLine line = heldLine.line();
                booking.addItem(BookingItem.create(
                        booking,
                        line.schedule(),
                        line.ticketType(),
                        line.passengerType(),
                        line.quantity(),
                        line.unitPrice(),
                        heldLine.hold().holdId()
                ));
            }
            booking = bookingRepository.save(booking);
            return toCreateBookingResponse(booking);
        } catch (RuntimeException exception) {
            releaseHolds(acquiredHoldIds, compensated);
            throw exception;
        }
    }

    @Override
    @Transactional
    public PageBookingResponse getMyBookings(String currentUserEmail, int page, int size, String keyword, String status) {
        User user = resolveUser(currentUserEmail);
        int safePage = Math.max(page, 0);
        int safeSize = sanitizeMyBookingsPageSize(size);
        String normalizedKeyword = keyword == null || keyword.isBlank() ? null : keyword.trim();
        boolean pendingGroup = status != null && "PENDING".equalsIgnoreCase(status.trim());
        BookingStatus normalizedStatus = parseHistoryStatus(status);
        PageRequest pageRequest = PageRequest.of(safePage, safeSize);
        Page<Booking> bookingPage;
        if (normalizedKeyword != null) {
            bookingPage = bookingRepository.searchMyBookings(
                    user, normalizedKeyword, normalizedStatus, pendingGroup, pageRequest);
        } else if (pendingGroup) {
            bookingPage = bookingRepository.findByUserAndStatusInOrderByCreatedAtDesc(
                    user,
                    List.of(BookingStatus.PROCESSING, BookingStatus.PENDING_PAYMENT),
                    pageRequest);
        } else if (normalizedStatus != null) {
            bookingPage = bookingRepository.findByUserAndStatusOrderByCreatedAtDesc(
                    user, normalizedStatus, pageRequest);
        } else {
            bookingPage = bookingRepository.findByUserOrderByCreatedAtDesc(user, pageRequest);
        }
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
                bookingPage.hasPrevious(),
                bookingHistorySummary(user)
        );
    }

    private BookingHistorySummary bookingHistorySummary(User user) {
        return new BookingHistorySummary(
                bookingRepository.countByUser(user),
                bookingRepository.countByUserAndStatusIn(
                        user, List.of(BookingStatus.PROCESSING, BookingStatus.PENDING_PAYMENT)),
                bookingRepository.countByUserAndStatus(user, BookingStatus.PAID),
                bookingRepository.countByUserAndStatusIn(
                        user, List.of(BookingStatus.EXPIRED, BookingStatus.FAILED))
        );
    }

    private BookingStatus parseHistoryStatus(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return null;
        }
        if ("PENDING".equalsIgnoreCase(status)) {
            return null;
        }
        try {
            return BookingStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unknown booking status");
        }
    }

    @Override
    @Transactional
    public BookingResponse getBookingDetail(UUID id, String currentUserEmail) {
        User user = resolveUser(currentUserEmail);
        return bookingRepository.findByIdAndUser(id, user)
                .map(this::expirePendingBookingIfNeeded)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
    }

    @Override
    @Transactional
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

    private List<NormalizedLine> normalizeItems(List<CreateBookingItemRequest> requestedItems) {
        if (requestedItems == null || requestedItems.isEmpty()) {
            throw new BadRequestException("At least one booking item is required");
        }
        if (requestedItems.size() > BookingPolicy.MAX_BOOKING_LINES) {
            throw new BadRequestException("Booking must not contain more than 20 items");
        }

        Map<LineKey, Integer> quantities = new LinkedHashMap<>();
        int totalQuantity = 0;
        for (CreateBookingItemRequest item : requestedItems) {
            if (item == null) {
                throw new BadRequestException("Booking item is required");
            }
            UUID scheduleId = parseUuid(item.scheduleId(), "Schedule ID is invalid");
            TicketType ticketType = TicketType.parse(item.ticketType());
            PassengerType passengerType = PassengerType.parse(item.passengerType());
            int quantity = validateQuantity(item.quantity());
            totalQuantity = Math.addExact(totalQuantity, quantity);
            if (totalQuantity > BookingPolicy.MAX_TICKETS_PER_BOOKING) {
                throw new BadRequestException("Booking must not contain more than 10 tickets");
            }
            LineKey key = new LineKey(scheduleId, ticketType, passengerType);
            int normalizedQuantity = Math.addExact(quantities.getOrDefault(key, 0), quantity);
            quantities.put(key, normalizedQuantity);
        }
        return quantities.entrySet().stream()
                .sorted(Map.Entry.comparingByKey(Comparator
                        .comparing((LineKey key) -> key.scheduleId().toString())
                        .thenComparing(key -> key.ticketType().name())
                        .thenComparing(key -> key.passengerType().name())))
                .map(entry -> new NormalizedLine(
                        entry.getKey().scheduleId(), entry.getKey().ticketType(),
                        entry.getKey().passengerType(), entry.getValue()))
                .toList();
    }

    private ResolvedLine resolveLine(NormalizedLine line) {
        ShowSchedule schedule = scheduleRepository.findById(line.scheduleId())
                .orElseThrow(() -> new NotFoundException("Schedule not found"));
        if (schedule.getStatus() != ScheduleStatus.ACTIVE) {
            throw new BadRequestException("Schedule is not bookable");
        }
        Instant startsAt = schedule.getStartTime().atZone(java.time.ZoneId.systemDefault()).toInstant();
        if (!startsAt.isAfter(Instant.now().plusSeconds(BOOKING_CUTOFF_MINUTES * 60))) {
            throw new BadRequestException("Bookings must be created at least 30 minutes before show start");
        }
        BigDecimal unitPrice = ticketPricingService.unitPrice(schedule.getStandardPrice(), line.ticketType());
        return new ResolvedLine(schedule, line.ticketType(), line.passengerType(), line.quantity(), unitPrice);
    }

    private CreateBookingResponse toCreateBookingResponse(Booking booking) {
        List<BookingItemResponse> items = booking.getItems().stream()
                .map(this::toBookingItemResponse)
                .toList();
        String firstHoldId = booking.getItems().isEmpty() ? null : booking.getItems().getFirst().getHoldId();
        return new CreateBookingResponse(
                booking.getId(),
                booking.getId(),
                firstHoldId,
                booking.getStatus(),
                "Booking created and awaiting payment.",
                booking.getExpiresAt(),
                items,
                booking.getTotalQuantity(),
                booking.getTotalAmount()
        );
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
                toEmailNotificationSummary(booking),
                booking.getItems().stream().map(this::toBookingItemResponse).toList(),
                booking.getTotalQuantity()
        );
    }

    private BookingItemResponse toBookingItemResponse(com.asms.booking.entity.BookingItem item) {
        return new BookingItemResponse(
                item.getId(),
                item.getShowId(),
                item.getScheduleId(),
                item.getShowName(),
                item.getImageUrl(),
                item.getStartTime(),
                item.getEndTime(),
                item.getVenueName(),
                item.getTicketType(),
                item.getPassengerType(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getLineTotal()
        );
    }

    private int validateQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new BadRequestException("Quantity must be at least 1");
        }
        if (quantity > BookingPolicy.MAX_TICKETS_PER_BOOKING) {
            throw new BadRequestException("Quantity must not exceed 10");
        }
        return quantity;
    }

    private UUID parseUuid(String value, String message) {
        try {
            return UUID.fromString(value);
        } catch (RuntimeException exception) {
            throw new BadRequestException(message);
        }
    }

    private void registerHoldsRollback(List<String> holdIds, AtomicBoolean compensated) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK && compensated.compareAndSet(false, true)) {
                    holdIds.forEach(redisTicketHoldService::releaseHold);
                }
            }
        });
    }

    private void releaseHolds(List<String> holdIds, AtomicBoolean compensated) {
        if (compensated.compareAndSet(false, true)) {
            holdIds.forEach(holdId -> {
                try {
                    redisTicketHoldService.releaseHold(holdId);
                } catch (RuntimeException releaseFailure) {
                    log.error("Failed to compensate Redis hold {}", holdId, releaseFailure);
                }
            });
        }
    }

    private String generateProductionBookingCode() {
        String bookingCode;
        do {
            bookingCode = "AQB" + LocalDate.now().format(BOOKING_CODE_DATE_FORMAT) + randomSuffix();
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
                        payment.getInventoryCommittedAt(),
                        payment.getReconciliationReason(),
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
                        ticket.getBookingItem() == null ? null : ticket.getBookingItem().getId(),
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
        booking.getItems().stream()
                .map(BookingItem::getHoldId)
                .filter(java.util.Objects::nonNull)
                .forEach(redisTicketHoldService::releaseHold);
        return bookingRepository.save(booking);
    }

    private record LineKey(UUID scheduleId, TicketType ticketType, PassengerType passengerType) {
    }

    private record NormalizedLine(UUID scheduleId, TicketType ticketType, PassengerType passengerType, int quantity) {
    }

    private record ResolvedLine(
            ShowSchedule schedule,
            TicketType ticketType,
            PassengerType passengerType,
            int quantity,
            BigDecimal unitPrice
    ) {
    }

    private record HeldLine(ResolvedLine line, HoldResult hold) {
    }

    private int sanitizeMyBookingsPageSize(int size) {
        if (size <= 0) {
            return DEFAULT_MY_BOOKINGS_PAGE_SIZE;
        }
        return Math.min(size, MAX_MY_BOOKINGS_PAGE_SIZE);
    }
}
