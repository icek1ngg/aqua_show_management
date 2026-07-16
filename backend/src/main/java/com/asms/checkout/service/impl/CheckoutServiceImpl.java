package com.asms.checkout.service.impl;

import com.asms.booking.entity.Booking;
import com.asms.booking.entity.BookingItem;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.enums.TicketType;
import com.asms.booking.repository.BookingRepository;
import com.asms.booking.service.RedisTicketHoldService;
import com.asms.booking.service.TicketPricingService;
import com.asms.booking.dto.TicketHoldDtos.HoldResult;
import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.enums.ScheduleStatus;
import com.asms.catalog.repository.ShowScheduleRepository;
import com.asms.checkout.dto.CheckoutDtos.*;
import com.asms.checkout.exception.CheckoutReviewRequiredException;
import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.ConflictException;
import com.asms.core.exception.NotFoundException;
import com.asms.core.exception.UnauthorizedException;
import com.asms.identity.entity.User;
import com.asms.payment.entity.Payment;
import com.asms.payment.repository.PaymentRepository;
import com.asms.payment.integration.PayOsClient;
import com.asms.payment.integration.PayOsPaymentLink;
import com.asms.checkout.service.CheckoutService;
import com.asms.checkout.service.CheckoutIdempotencyLockService;
import com.asms.core.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CheckoutServiceImpl implements CheckoutService {
    private static final Logger log = LoggerFactory.getLogger(CheckoutServiceImpl.class);
    private static final int MAX_TICKETS_PER_BOOKING = 10;
    private static final int MAX_BOOKING_LINES = 20;
    private static final long BOOKING_CUTOFF_MINUTES = 30;
    private static final DateTimeFormatter BOOKING_CODE_DATE_FORMAT = DateTimeFormatter.BASIC_ISO_DATE;

    private final BookingRepository bookingRepository;
    private final ShowScheduleRepository scheduleRepository;
    private final RedisTicketHoldService redisTicketHoldService;
    private final TicketPricingService ticketPricingService;
    private final PaymentRepository paymentRepository;
    private final PayOsClient payOsClient;
    private final TransactionTemplate transactionTemplate;
    private final CheckoutIdempotencyLockService idempotencyLockService;

    public CheckoutServiceImpl(
            BookingRepository bookingRepository,
            ShowScheduleRepository scheduleRepository,
            RedisTicketHoldService redisTicketHoldService,
            TicketPricingService ticketPricingService,
            PaymentRepository paymentRepository,
            PayOsClient payOsClient,
            PlatformTransactionManager transactionManager,
            CheckoutIdempotencyLockService idempotencyLockService
    ) {
        this.bookingRepository = bookingRepository;
        this.scheduleRepository = scheduleRepository;
        this.redisTicketHoldService = redisTicketHoldService;
        this.ticketPricingService = ticketPricingService;
        this.paymentRepository = paymentRepository;
        this.payOsClient = payOsClient;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.idempotencyLockService = idempotencyLockService;
    }

    @Override
    public StartPaymentResponse startPayment(StartPaymentRequest request, User user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication required");
        }

        String idempotencyKey = request.idempotencyKey().trim();
        return idempotencyLockService.execute(
                user.getId(),
                idempotencyKey,
                () -> startPaymentLocked(request, user, idempotencyKey)
        );
    }

    private StartPaymentResponse startPaymentLocked(StartPaymentRequest request, User user, String idempotencyKey) {
        Optional<Booking> existingBookingOpt = bookingRepository.findByUserAndIdempotencyKey(user, idempotencyKey);

        if (existingBookingOpt.isPresent()) {
            Booking existing = existingBookingOpt.get();
            if (!isSamePayload(existing, request.items())) {
                throw new ConflictException(
                        ErrorCode.IDEMPOTENCY_KEY_REUSED,
                        "Idempotency key was already used with a different checkout payload"
                );
            }
            return buildResponse(existing);
        }

        List<NormalizedLine> normalizedLines = normalizeItems(request.items());
        List<ResolvedLine> resolvedLines = resolveLines(normalizedLines);

        List<CheckoutReviewItem> reviewItems = new ArrayList<>();
        boolean reviewRequired = false;

        for (ResolvedLine line : resolvedLines) {
            boolean mismatch = false;
            if (line.expectedUnitPrice.compareTo(line.actualUnitPrice) != 0) {
                mismatch = true;
            }
            int persistentAvailable = line.schedule.availableFor(line.ticketType);
            if (persistentAvailable < line.quantity) {
                mismatch = true;
            }

            if (mismatch) {
                reviewRequired = true;
                reviewItems.add(new CheckoutReviewItem(
                        line.schedule.getId().toString(),
                        line.ticketType.name(),
                        line.quantity,
                        persistentAvailable,
                        line.expectedUnitPrice,
                        line.actualUnitPrice
                ));
            }
        }

        if (reviewRequired) {
            throw new CheckoutReviewRequiredException(new CheckoutReviewRequiredData(reviewItems));
        }

        List<String> acquiredHoldIds = new ArrayList<>();
        List<HeldLine> heldLines = new ArrayList<>();

        try {
            for (ResolvedLine line : resolvedLines) {
                String scheduleId = line.schedule.getId().toString();
                redisTicketHoldService.initializeInventory(scheduleId, line.ticketType, line.schedule.availableFor(line.ticketType));
                HoldResult hold = redisTicketHoldService.holdTickets(
                        scheduleId, line.ticketType, line.quantity, user.getId());

                if (hold == null || !hold.success()) {
                    throw new ConflictException("Not enough tickets available during holding.");
                }
                acquiredHoldIds.add(hold.holdId());
                heldLines.add(new HeldLine(line, hold));
            }
        } catch (Exception e) {
            for (String holdId : acquiredHoldIds) {
                try {
                    redisTicketHoldService.releaseHold(holdId);
                } catch (Exception ex) {
                    log.error("Failed to release hold {}", holdId, ex);
                }
            }
            throw e;
        }

        Instant expiresAt = heldLines.stream()
                .map(line -> line.hold.expiresAt())
                .filter(Objects::nonNull)
                .min(Instant::compareTo)
                .orElseGet(() -> Instant.now().plusSeconds(15 * 60));

        String[] payosOrderCodeRef = new String[1];
        boolean[] providerLinkCreatedRef = new boolean[1];

        try {
            StartPaymentResponse response = transactionTemplate.execute(status -> {
                Booking booking = Booking.create(user, generateProductionBookingCode(), expiresAt);
                booking.setIdempotencyKey(idempotencyKey);

                for (HeldLine heldLine : heldLines) {
                    ResolvedLine line = heldLine.line;
                    booking.addItem(BookingItem.create(
                            booking,
                            line.schedule,
                            line.ticketType,
                            line.quantity,
                            line.actualUnitPrice,
                            heldLine.hold.holdId()
                    ));
                }

                Booking savedBooking = bookingRepository.save(booking);

                payosOrderCodeRef[0] = generateOrderCode(savedBooking.getId());
                PayOsPaymentLink payOsPaymentLink;
                try {
                    payOsPaymentLink = payOsClient.createPaymentLink(savedBooking, payosOrderCodeRef[0]);
                    providerLinkCreatedRef[0] = true;
                } catch (Exception e) {
                    status.setRollbackOnly();
                    throw e;
                }

                Payment payment = new Payment(savedBooking, payosOrderCodeRef[0], savedBooking.getTotalAmount(), payOsPaymentLink.checkoutUrl());
                payment.setQrCode(payOsPaymentLink.qrCode());
                payment.setPaymentLinkId(payOsPaymentLink.paymentLinkId());
                payment.setBankBin(payOsPaymentLink.bin());
                payment.setAccountNumber(payOsPaymentLink.accountNumber());
                payment.setAccountName(payOsPaymentLink.accountName());
                payment.setPaymentDescription(payOsPaymentLink.description());
                paymentRepository.save(payment);

                return buildResponse(savedBooking, payment, payOsPaymentLink);
            });
            return response;
        } catch (Exception e) {
            for (String holdId : acquiredHoldIds) {
                try {
                    redisTicketHoldService.releaseHold(holdId);
                } catch (Exception ex) {
                    log.error("Failed to release hold {}", holdId, ex);
                }
            }
            if (providerLinkCreatedRef[0] && payosOrderCodeRef[0] != null) {
                try {
                    payOsClient.cancelPaymentLink(payosOrderCodeRef[0], "CANCELLED");
                } catch (Exception ex) {
                    log.error("Failed to cancel PayOS payment link {}", payosOrderCodeRef[0], ex);
                }
            }
            throw e;
        }
    }

    private boolean isSamePayload(Booking existing, List<CheckoutItemRequest> items) {
        List<NormalizedLine> reqNormalized = normalizeItems(items);
        if (existing.getItems().size() != reqNormalized.size()) return false;

        Map<LineKey, ExistingLineData> existingMap = new HashMap<>();
        for (BookingItem item : existing.getItems()) {
            LineKey key = new LineKey(UUID.fromString(item.getScheduleId()), item.getTicketType());
            ExistingLineData current = existingMap.get(key);
            if (current == null) {
                existingMap.put(key, new ExistingLineData(item.getQuantity(), item.getUnitPrice()));
            } else {
                current.quantity += item.getQuantity();
                if (current.unitPrice.compareTo(item.getUnitPrice()) != 0) {
                    return false;
                }
            }
        }

        for (NormalizedLine line : reqNormalized) {
            ExistingLineData existingLine = existingMap.get(new LineKey(line.scheduleId, line.ticketType));
            if (existingLine == null
                    || existingLine.quantity != line.quantity
                    || existingLine.unitPrice.compareTo(line.expectedUnitPrice) != 0) {
                return false;
            }
        }
        return true;
    }

    private List<NormalizedLine> normalizeItems(List<CheckoutItemRequest> requestedItems) {
        if (requestedItems == null || requestedItems.isEmpty()) {
            throw new BadRequestException("At least one booking item is required");
        }
        if (requestedItems.size() > MAX_BOOKING_LINES) {
            throw new BadRequestException("Booking must not contain more than 20 items");
        }

        Map<LineKey, NormalizedLineData> map = new LinkedHashMap<>();
        for (CheckoutItemRequest item : requestedItems) {
            if (item == null) {
                throw new BadRequestException("Booking item is required");
            }
            UUID scheduleId;
            try {
                scheduleId = UUID.fromString(item.scheduleId());
            } catch (Exception e) {
                throw new BadRequestException("Schedule ID is invalid");
            }
            TicketType ticketType = TicketType.parse(item.ticketType());
            int quantity = validateQuantity(item.quantity());
            BigDecimal expectedPrice = item.expectedUnitPrice();
            if (expectedPrice == null || expectedPrice.compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("Invalid expected unit price");
            }

            LineKey key = new LineKey(scheduleId, ticketType);
            if (map.containsKey(key)) {
                NormalizedLineData data = map.get(key);
                if (data.expectedUnitPrice.compareTo(expectedPrice) != 0) {
                    throw new BadRequestException("Conflicting expected prices for same schedule and ticket type");
                }
                data.quantity += quantity;
                if (data.quantity > MAX_TICKETS_PER_BOOKING) {
                    throw new BadRequestException("Quantity must not exceed 10 per schedule and ticket type");
                }
            } else {
                map.put(key, new NormalizedLineData(quantity, expectedPrice));
            }
        }

        return map.entrySet().stream()
                .map(e -> new NormalizedLine(e.getKey().scheduleId, e.getKey().ticketType, e.getValue().quantity, e.getValue().expectedUnitPrice))
                .collect(Collectors.toList());
    }

    private List<ResolvedLine> resolveLines(List<NormalizedLine> lines) {
        return lines.stream().map(line -> {
            ShowSchedule schedule = scheduleRepository.findById(line.scheduleId)
                    .orElseThrow(() -> new NotFoundException("Schedule not found"));
            if (schedule.getStatus() != ScheduleStatus.ACTIVE) {
                throw new BadRequestException("Schedule is not bookable");
            }
            Instant startsAt = schedule.getStartTime().atZone(java.time.ZoneId.systemDefault()).toInstant();
            if (!startsAt.isAfter(Instant.now().plusSeconds(BOOKING_CUTOFF_MINUTES * 60))) {
                throw new BadRequestException("Bookings must be created at least 30 minutes before show start");
            }
            BigDecimal actualUnitPrice = ticketPricingService.unitPrice(schedule.getStandardPrice(), line.ticketType);
            return new ResolvedLine(schedule, line.ticketType, line.quantity, line.expectedUnitPrice, actualUnitPrice);
        }).collect(Collectors.toList());
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

    private StartPaymentResponse buildResponse(Booking booking) {
        Payment payment = paymentRepository.findByBooking_Id(booking.getId()).orElse(null);
        return buildResponse(booking, payment, null);
    }

    private StartPaymentResponse buildResponse(Booking booking, Payment payment, PayOsPaymentLink paymentLink) {
        CheckoutPayment cp = null;
        if (payment != null) {
            long expiresInSeconds = Math.max(0, Duration.between(Instant.now(), booking.getExpiresAt()).toSeconds());
            cp = new CheckoutPayment(
                    payment.getId().toString(),
                    payment.getPaymentLink(),
                    payment.getQrCode(),
                    (int) expiresInSeconds
            );
        }

        List<Object> items = booking.getItems().stream().map(item -> Map.of(
                "scheduleId", item.getScheduleId(),
                "ticketType", item.getTicketType().name(),
                "quantity", item.getQuantity(),
                "unitPrice", item.getUnitPrice()
        )).collect(Collectors.toList());

        return new StartPaymentResponse(
                booking.getId().toString(),
                booking.getStatus().name(),
                booking.getExpiresAt(),
                items,
                booking.getTotalQuantity(),
                booking.getTotalAmount(),
                cp
        );
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

    private String generateOrderCode(UUID bookingId) {
        long base = Instant.now().toEpochMilli() % 900_000_000_000L;
        long suffix = java.util.concurrent.ThreadLocalRandom.current().nextLong(100, 999);
        return String.valueOf((base * 1000) + suffix);
    }

    private record LineKey(UUID scheduleId, TicketType ticketType) {}
    private static class NormalizedLineData {
        int quantity;
        BigDecimal expectedUnitPrice;
        NormalizedLineData(int quantity, BigDecimal expectedUnitPrice) {
            this.quantity = quantity;
            this.expectedUnitPrice = expectedUnitPrice;
        }
    }
    private static class ExistingLineData {
        int quantity;
        BigDecimal unitPrice;
        ExistingLineData(int quantity, BigDecimal unitPrice) {
            this.quantity = quantity;
            this.unitPrice = unitPrice;
        }
    }
    private record NormalizedLine(UUID scheduleId, TicketType ticketType, int quantity, BigDecimal expectedUnitPrice) {}
    private record ResolvedLine(ShowSchedule schedule, TicketType ticketType, int quantity, BigDecimal expectedUnitPrice, BigDecimal actualUnitPrice) {}
    private record HeldLine(ResolvedLine line, HoldResult hold) {}
}
