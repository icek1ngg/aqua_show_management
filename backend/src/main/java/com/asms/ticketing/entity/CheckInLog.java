package com.asms.ticketing.entity;

import com.asms.identity.entity.User;
import com.asms.ticketing.enums.CheckInResult;
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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "check_in_logs")
public class CheckInLog {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_id", nullable = false)
    private User staff;

    @Column(nullable = false)
    private Instant checkInTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CheckInResult result;

    @Column(length = 500)
    private String failureReason;

    protected CheckInLog() {
    }

    public CheckInLog(Ticket ticket, User staff, CheckInResult result, String failureReason) {
        this.id = UUID.randomUUID();
        this.ticket = ticket;
        this.staff = staff;
        this.result = result;
        this.failureReason = failureReason;
        this.checkInTime = Instant.now();
    }

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (checkInTime == null) {
            checkInTime = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public Instant getCheckInTime() {
        return checkInTime;
    }

    public CheckInResult getResult() {
        return result;
    }
}
