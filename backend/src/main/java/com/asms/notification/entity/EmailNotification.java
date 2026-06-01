package com.asms.notification.entity;

import com.asms.booking.entity.Booking;
import com.asms.identity.entity.User;
import com.asms.notification.enums.EmailNotificationStatus;
import com.asms.notification.enums.EmailNotificationType;
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
@Table(name = "email_notifications")
public class EmailNotification {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private EmailNotificationType emailType;

    @Column(nullable = false, length = 255)
    private String recipientEmail;

    @Column(nullable = false, length = 255)
    private String subject;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EmailNotificationStatus status;

    @Column
    private Instant sentAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected EmailNotification() {
    }

    public EmailNotification(User user, Booking booking, EmailNotificationType emailType, String recipientEmail, String subject) {
        this.id = UUID.randomUUID();
        this.user = user;
        this.booking = booking;
        this.emailType = emailType;
        this.recipientEmail = recipientEmail;
        this.subject = subject;
        this.status = EmailNotificationStatus.PENDING;
    }

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (status == null) {
            status = EmailNotificationStatus.PENDING;
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public EmailNotificationType getEmailType() {
        return emailType;
    }

    public EmailNotificationStatus getStatus() {
        return status;
    }

    public void setStatus(EmailNotificationStatus status) {
        this.status = status;
    }

    public Instant getSentAt() {
        return sentAt;
    }

    public void setSentAt(Instant sentAt) {
        this.sentAt = sentAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
