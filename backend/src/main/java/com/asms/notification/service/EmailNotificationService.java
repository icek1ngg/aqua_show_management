package com.asms.notification.service;

import com.asms.booking.entity.Booking;
import com.asms.ticketing.entity.Ticket;

import java.util.List;
import java.util.UUID;

public interface EmailNotificationService {

    void sendPaymentSuccessEmail(Booking booking, List<Ticket> tickets);

    void resendPaymentSuccessEmail(UUID bookingId, String currentUserEmail);
}
