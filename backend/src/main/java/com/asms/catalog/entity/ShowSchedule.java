package com.asms.catalog.entity;

import com.asms.booking.enums.TicketType;
import com.asms.catalog.enums.ScheduleStatus;
import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.ConflictException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "show_schedules")
public class ShowSchedule {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "show_id", nullable = false)
    private Show show;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "venue_id", nullable = false)
    private Venue venue;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Column(name = "standard_capacity", nullable = false)
    private Integer standardCapacity;

    @Column(name = "vip_capacity", nullable = false)
    private Integer vipCapacity;

    @Column(name = "family_capacity", nullable = false)
    private Integer familyCapacity;

    @Column(name = "standard_available_tickets", nullable = false)
    private Integer standardAvailableTickets;

    @Column(name = "vip_available_tickets", nullable = false)
    private Integer vipAvailableTickets;

    @Column(name = "family_available_tickets", nullable = false)
    private Integer familyAvailableTickets;

    @Column(name = "standard_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal standardPrice;

    // Retained as write-only compatibility columns until the legacy schema can be removed.
    @Column(name = "capacity", nullable = false)
    private Integer legacyCapacity;

    @Column(name = "available_tickets", nullable = false)
    private Integer legacyAvailableTickets;

    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal legacyPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ScheduleStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected ShowSchedule() {
    }

    public ShowSchedule(
            Show show,
            Venue venue,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Integer standardCapacity,
            Integer vipCapacity,
            Integer familyCapacity,
            BigDecimal standardPrice
    ) {
        this.id = UUID.randomUUID();
        this.show = show;
        this.venue = venue;
        this.startTime = startTime;
        this.endTime = endTime;
        this.standardCapacity = standardCapacity;
        this.vipCapacity = vipCapacity;
        this.familyCapacity = familyCapacity;
        this.standardAvailableTickets = standardCapacity;
        this.vipAvailableTickets = vipCapacity;
        this.familyAvailableTickets = familyCapacity;
        this.standardPrice = standardPrice;
        syncLegacyColumns();
        this.status = ScheduleStatus.ACTIVE;
    }

    public ShowSchedule(Show show, Venue venue, LocalDateTime startTime, LocalDateTime endTime, Integer capacity, BigDecimal price) {
        this(show, venue, startTime, endTime, capacity, 0, 0, price);
    }

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (status == null) {
            status = ScheduleStatus.ACTIVE;
        }
        if (standardAvailableTickets == null) {
            standardAvailableTickets = standardCapacity;
        }
        if (vipAvailableTickets == null) {
            vipAvailableTickets = vipCapacity;
        }
        if (familyAvailableTickets == null) {
            familyAvailableTickets = familyCapacity;
        }
        syncLegacyColumns();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public Show getShow() {
        return show;
    }

    public void setShow(Show show) {
        this.show = show;
    }

    public Venue getVenue() {
        return venue;
    }

    public void setVenue(Venue venue) {
        this.venue = venue;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public int getStandardCapacity() {
        return standardCapacity;
    }

    public void setStandardCapacity(Integer standardCapacity) {
        this.standardCapacity = standardCapacity;
        syncLegacyColumns();
    }

    public int getVipCapacity() {
        return vipCapacity;
    }

    public void setVipCapacity(Integer vipCapacity) {
        this.vipCapacity = vipCapacity;
        syncLegacyColumns();
    }

    public int getFamilyCapacity() {
        return familyCapacity;
    }

    public void setFamilyCapacity(Integer familyCapacity) {
        this.familyCapacity = familyCapacity;
        syncLegacyColumns();
    }

    public int getTotalCapacity() {
        return standardCapacity + vipCapacity + familyCapacity;
    }

    public int getStandardAvailableTickets() {
        return standardAvailableTickets;
    }

    public void setStandardAvailableTickets(Integer standardAvailableTickets) {
        this.standardAvailableTickets = standardAvailableTickets;
        syncLegacyColumns();
    }

    public int getVipAvailableTickets() {
        return vipAvailableTickets;
    }

    public void setVipAvailableTickets(Integer vipAvailableTickets) {
        this.vipAvailableTickets = vipAvailableTickets;
        syncLegacyColumns();
    }

    public int getFamilyAvailableTickets() {
        return familyAvailableTickets;
    }

    public void setFamilyAvailableTickets(Integer familyAvailableTickets) {
        this.familyAvailableTickets = familyAvailableTickets;
        syncLegacyColumns();
    }

    public int getTotalAvailableTickets() {
        return standardAvailableTickets + vipAvailableTickets + familyAvailableTickets;
    }

    public BigDecimal getStandardPrice() {
        return standardPrice;
    }

    public void setStandardPrice(BigDecimal standardPrice) {
        this.standardPrice = standardPrice;
        syncLegacyColumns();
    }

    public int availableFor(TicketType type) {
        return switch (type) {
            case STANDARD -> standardAvailableTickets;
            case VIP -> vipAvailableTickets;
            case FAMILY -> familyAvailableTickets;
        };
    }

    public void decrementAvailable(TicketType type, int quantity) {
        if (quantity <= 0) {
            throw new BadRequestException("Quantity must be greater than 0");
        }
        long next = (long) availableFor(type) - quantity;
        if (next < 0) {
            throw new ConflictException("Not enough tickets available");
        }
        switch (type) {
            case STANDARD -> standardAvailableTickets = (int) next;
            case VIP -> vipAvailableTickets = (int) next;
            case FAMILY -> familyAvailableTickets = (int) next;
        }
        syncLegacyColumns();
    }

    public int getCapacity() {
        return getTotalCapacity();
    }

    public int getAvailableTickets() {
        return getTotalAvailableTickets();
    }

    public BigDecimal getPrice() {
        return getStandardPrice();
    }

    public ScheduleStatus getStatus() {
        return status;
    }

    public void setStatus(ScheduleStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    private void syncLegacyColumns() {
        if (standardCapacity != null && vipCapacity != null && familyCapacity != null) {
            legacyCapacity = getTotalCapacity();
        }
        if (standardAvailableTickets != null && vipAvailableTickets != null && familyAvailableTickets != null) {
            legacyAvailableTickets = getTotalAvailableTickets();
        }
        if (standardPrice != null) {
            legacyPrice = standardPrice;
        }
    }
}
