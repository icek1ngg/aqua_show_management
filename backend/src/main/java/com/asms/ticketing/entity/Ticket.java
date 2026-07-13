package com.asms.ticketing.entity;

import com.asms.booking.entity.Booking;
import com.asms.booking.entity.BookingItem;
import com.asms.booking.enums.TicketType;
import com.asms.ticketing.enums.TicketStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "tickets",
        indexes = {
                @Index(name = "idx_tickets_qr_code", columnList = "qr_code", unique = true)
        }
)
public class Ticket {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_item_id")
    private BookingItem bookingItem;

    @Column(nullable = false, length = 100)
    private String scheduleId;

    @Column(nullable = false, length = 255)
    private String showName;

    @Column(length = 255)
    private String venueName;

    @Column
    private Instant showStartTime;

    @Column
    private Instant showEndTime;

    @Column(nullable = false, unique = true, length = 180)
    private String qrCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TicketStatus status;

    @Column(nullable = false, updatable = false)
    private Instant issuedAt;

    @Column
    private Instant usedAt;

    protected Ticket() {
    }

    public Ticket(Booking booking, String qrCode) {
        this.id = UUID.randomUUID();
        this.booking = booking;
        this.scheduleId = booking.getScheduleId();
        this.showName = booking.getShowName();
        this.venueName = "Main Plaza Pool";
        this.showStartTime = booking.getShowDate().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
        this.showEndTime = this.showStartTime.plusSeconds(45 * 60);
        this.qrCode = qrCode;
        this.status = TicketStatus.VALID;
        this.issuedAt = Instant.now();
    }

    public Ticket(Booking booking, BookingItem bookingItem, String qrCode) {
        if (bookingItem == null) {
            throw new IllegalArgumentException("Booking item is required");
        }
        this.id = UUID.randomUUID();
        this.booking = booking;
        this.bookingItem = bookingItem;
        this.scheduleId = bookingItem.getScheduleId();
        this.showName = bookingItem.getShowName();
        this.venueName = bookingItem.getVenueName();
        this.showStartTime = bookingItem.getStartTime()
                .atZone(java.time.ZoneId.systemDefault()).toInstant();
        this.showEndTime = bookingItem.getEndTime()
                .atZone(java.time.ZoneId.systemDefault()).toInstant();
        this.qrCode = qrCode;
        this.status = TicketStatus.VALID;
        this.issuedAt = Instant.now();
    }

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (status == null) {
            status = TicketStatus.VALID;
        }
        if (issuedAt == null) {
            issuedAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public Booking getBooking() {
        return booking;
    }

    public BookingItem getBookingItem() {
        return bookingItem;
    }

    public TicketType getTicketType() {
        return bookingItem == null ? TicketType.parse(booking.getTicketType()) : bookingItem.getTicketType();
    }

    public String getScheduleId() {
        return scheduleId;
    }

    public String getShowName() {
        return showName;
    }

    public String getVenueName() {
        return venueName;
    }

    public Instant getShowStartTime() {
        return showStartTime;
    }

    public Instant getShowEndTime() {
        return showEndTime;
    }

    public String getQrCode() {
        return qrCode;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public void setStatus(TicketStatus status) {
        this.status = status;
    }

    public Instant getIssuedAt() {
        return issuedAt;
    }

    public Instant getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(Instant usedAt) {
        this.usedAt = usedAt;
    }
}
