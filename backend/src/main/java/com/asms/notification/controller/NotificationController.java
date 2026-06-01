package com.asms.notification.controller;

import com.asms.core.exception.UnauthorizedException;
import com.asms.core.response.ApiResponse;
import com.asms.identity.entity.User;
import com.asms.notification.service.EmailNotificationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final EmailNotificationService emailNotificationService;

    public NotificationController(EmailNotificationService emailNotificationService) {
        this.emailNotificationService = emailNotificationService;
    }

    @PostMapping("/bookings/{bookingId}/resend-ticket-email")
    public ApiResponse<Void> resendTicketEmail(
            @AuthenticationPrincipal User user,
            @PathVariable("bookingId") UUID bookingId
    ) {
        if (user == null) {
            throw new UnauthorizedException("Authentication required");
        }
        emailNotificationService.resendPaymentSuccessEmail(bookingId, user.getEmail());
        return ApiResponse.success("Ticket email resend requested");
    }
}
