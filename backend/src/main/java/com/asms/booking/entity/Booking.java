package com.asms.booking.entity;

import com.asms.booking.enums.BookingStatus;
import com.asms.booking.enums.TicketType;
import com.asms.identity.entity.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
        name = "bookings",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_bookings_user_idempotency_key",
                columnNames = {"user_id", "idempotency_key"}
        )
)
public class Booking {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true, length = 50)
    private String bookingCode;

    @Column(name = "idempotency_key", nullable = false, length = 100)
    private String idempotencyKey;

    @Column(name = "checkout_payload_hash", length = 64)
    private String checkoutPayloadHash;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookingItem> items = new ArrayList<>();

    @Column(nullable = false)
    private Integer totalQuantity = 0;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO.setScale(2);

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BookingStatus status;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Column(nullable = false)
    private Instant expiresAt;

    protected Booking() {
    }

    public static Booking create() {
        return new Booking();
    }

    public static Booking create(User user, String bookingCode, Instant expiresAt) {
        Booking booking = new Booking();
        booking.user = user;
        booking.bookingCode = bookingCode;
        booking.idempotencyKey = bookingCode;
        booking.expiresAt = expiresAt;
        booking.status = BookingStatus.PENDING_PAYMENT;
        return booking;
    }

    public void addItem(BookingItem item) {
        if (item == null) {
            throw new IllegalArgumentException("Booking item is required");
        }
        if (!items.contains(item)) {
            items.add(item);
        }
        item.attachTo(this);
        recalculateTotals();
    }

    public List<BookingItem> items() {
        return Collections.unmodifiableList(items);
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        recalculateTotals();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
        recalculateTotals();
    }

    void recalculateTotals() {
        totalQuantity = items.stream().mapToInt(BookingItem::getQuantity).sum();
        totalAmount = items.stream()
                .map(BookingItem::getLineTotal)
                .reduce(BigDecimal.ZERO.setScale(2), BigDecimal::add);
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getBookingCode() {
        return bookingCode;
    }

    public void setBookingCode(String bookingCode) {
        this.bookingCode = bookingCode;
        if (idempotencyKey == null) {
            idempotencyKey = bookingCode;
        }
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getCheckoutPayloadHash() {
        return checkoutPayloadHash;
    }

    public void setCheckoutPayloadHash(String checkoutPayloadHash) {
        this.checkoutPayloadHash = checkoutPayloadHash;
    }

    public List<BookingItem> getItems() {
        return items();
    }

    public Integer getTotalQuantity() {
        return totalQuantity;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    // Temporary compatibility accessors for services migrated in Tasks 6 and 7.
    public String getHoldId() {
        return firstItem().getHoldId();
    }

    public void setHoldId(String holdId) {
        mutableFirstItem().setHoldId(holdId);
    }

    public String getShowId() {
        return firstItem().getShowId();
    }

    public void setShowId(String showId) {
        mutableFirstItem().setShowId(showId);
    }

    public String getScheduleId() {
        return firstItem().getScheduleId();
    }

    public void setScheduleId(String scheduleId) {
        mutableFirstItem().setScheduleId(scheduleId);
    }

    public String getShowName() {
        return firstItem().getShowName();
    }

    public void setShowName(String showName) {
        mutableFirstItem().setShowName(showName);
    }

    public LocalDate getShowDate() {
        return firstItem().getStartTime() == null ? null : firstItem().getStartTime().toLocalDate();
    }

    public void setShowDate(LocalDate showDate) {
        mutableFirstItem().setShowDate(showDate);
    }

    public String getTicketType() {
        return firstItem().getTicketType().name();
    }

    public void setTicketType(String ticketType) {
        mutableFirstItem().setTicketType(TicketType.parse(ticketType));
    }

    public Integer getQuantity() {
        return totalQuantity;
    }

    public void setQuantity(Integer quantity) {
        mutableFirstItem().setQuantity(quantity);
        recalculateTotals();
    }

    public BigDecimal getUnitPrice() {
        return firstItem().getUnitPrice();
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        mutableFirstItem().setUnitPrice(unitPrice);
        recalculateTotals();
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    private BookingItem firstItem() {
        if (items.isEmpty()) {
            throw new IllegalStateException("Booking has no items");
        }
        return items.getFirst();
    }

    private BookingItem mutableFirstItem() {
        if (items.isEmpty()) {
            BookingItem item = BookingItem.legacyDraft(this);
            items.add(item);
        }
        return items.getFirst();
    }
}
