package com.asms.booking.entity;

import com.asms.booking.enums.TicketType;
import com.asms.catalog.entity.ShowSchedule;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "booking_items")
public class BookingItem {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(nullable = false, length = 100)
    private String showId;

    @Column(nullable = false, length = 100)
    private String scheduleId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TicketType ticketType;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;

    @Column(nullable = false, unique = true, length = 100)
    private String holdId;

    @Column(nullable = false, length = 255)
    private String showName;

    @Column(length = 500)
    private String imageUrl;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Column(nullable = false, length = 255)
    private String venueName;

    protected BookingItem() {
    }

    public static BookingItem create(
            Booking booking,
            ShowSchedule schedule,
            TicketType ticketType,
            int quantity,
            BigDecimal unitPrice,
            String holdId
    ) {
        if (schedule == null || ticketType == null || quantity <= 0 || unitPrice == null
                || unitPrice.signum() < 0 || holdId == null || holdId.isBlank()) {
            throw new IllegalArgumentException("Complete booking item details are required");
        }
        BookingItem item = new BookingItem();
        item.id = UUID.randomUUID();
        item.booking = booking;
        item.showId = schedule.getShow().getId().toString();
        item.scheduleId = schedule.getId().toString();
        item.ticketType = ticketType;
        item.quantity = quantity;
        item.unitPrice = money(unitPrice);
        item.lineTotal = money(unitPrice.multiply(BigDecimal.valueOf(quantity)));
        item.holdId = holdId;
        item.showName = schedule.getShow().getTitle();
        item.imageUrl = schedule.getShow().getImageUrl();
        item.startTime = schedule.getStartTime();
        item.endTime = schedule.getEndTime();
        item.venueName = schedule.getVenue().getName();
        return item;
    }

    static BookingItem legacyDraft(Booking booking) {
        BookingItem item = new BookingItem();
        item.id = UUID.randomUUID();
        item.booking = booking;
        item.showId = "legacy";
        item.scheduleId = "legacy";
        item.ticketType = TicketType.STANDARD;
        item.quantity = 1;
        item.unitPrice = BigDecimal.ZERO.setScale(2);
        item.lineTotal = BigDecimal.ZERO.setScale(2);
        item.holdId = "legacy:" + item.id;
        item.showName = "Legacy show";
        item.startTime = LocalDateTime.now();
        item.endTime = item.startTime;
        item.venueName = "Legacy venue";
        return item;
    }

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        recalculateLineTotal();
    }

    void attachTo(Booking booking) {
        this.booking = booking;
    }

    public UUID getId() {
        return id;
    }

    public Booking getBooking() {
        return booking;
    }

    public String getShowId() {
        return showId;
    }

    void setShowId(String showId) {
        this.showId = showId;
    }

    public String getScheduleId() {
        return scheduleId;
    }

    void setScheduleId(String scheduleId) {
        this.scheduleId = scheduleId;
    }

    public TicketType getTicketType() {
        return ticketType;
    }

    void setTicketType(TicketType ticketType) {
        this.ticketType = ticketType;
    }

    public Integer getQuantity() {
        return quantity;
    }

    void setQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Booking item quantity must be positive");
        }
        this.quantity = quantity;
        recalculateLineTotal();
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    void setUnitPrice(BigDecimal unitPrice) {
        if (unitPrice == null || unitPrice.signum() < 0) {
            throw new IllegalArgumentException("Booking item unit price must not be negative");
        }
        this.unitPrice = money(unitPrice);
        recalculateLineTotal();
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public String getHoldId() {
        return holdId;
    }

    void setHoldId(String holdId) {
        this.holdId = holdId;
    }

    public String getShowName() {
        return showName;
    }

    void setShowName(String showName) {
        this.showName = showName;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    void setShowDate(LocalDate showDate) {
        if (showDate != null) {
            startTime = showDate.atStartOfDay();
            endTime = startTime;
        }
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public String getVenueName() {
        return venueName;
    }

    private void recalculateLineTotal() {
        if (quantity != null && unitPrice != null) {
            lineTotal = money(unitPrice.multiply(BigDecimal.valueOf(quantity)));
        }
    }

    private static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
