package com.asms.notification.repository;

import com.asms.notification.entity.EmailNotification;
import com.asms.notification.enums.EmailNotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EmailNotificationRepository extends JpaRepository<EmailNotification, UUID> {

    Optional<EmailNotification> findTopByBooking_IdOrderByCreatedAtDesc(UUID bookingId);

    boolean existsByBooking_IdAndStatus(UUID bookingId, EmailNotificationStatus status);
}
