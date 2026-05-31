package com.asms.booking.controller;

import com.asms.booking.dto.BookingDtos.BookingResponse;
import com.asms.booking.dto.BookingDtos.CreateBookingRequest;
import com.asms.booking.dto.BookingDtos.CreateBookingResponse;
import com.asms.booking.service.BookingService;
import com.asms.core.exception.UnauthorizedException;
import com.asms.core.response.ApiResponse;
import com.asms.identity.entity.User;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ApiResponse<CreateBookingResponse> createBooking(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateBookingRequest request
    ) {
        return ApiResponse.success(
                "Booking request is being processed.",
                bookingService.createBooking(request, currentUserEmail(user))
        );
    }

    @GetMapping("/my")
    public ApiResponse<List<BookingResponse>> getMyBookings(@AuthenticationPrincipal User user) {
        return ApiResponse.success(
                "Bookings fetched successfully",
                bookingService.getMyBookings(currentUserEmail(user))
        );
    }

    @GetMapping("/{id}")
    public ApiResponse<BookingResponse> getBookingDetail(
            @AuthenticationPrincipal User user,
            @PathVariable("id") UUID id
    ) {
        return ApiResponse.success(
                "Booking fetched successfully",
                bookingService.getBookingDetail(id, currentUserEmail(user))
        );
    }

    @GetMapping("/hold/{holdId}")
    public ApiResponse<BookingResponse> getBookingByHoldId(
            @AuthenticationPrincipal User user,
            @PathVariable("holdId") String holdId
    ) {
        return ApiResponse.success(
                "Booking fetched successfully",
                bookingService.getBookingByHoldId(holdId, currentUserEmail(user))
        );
    }

    private String currentUserEmail(User user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication required");
        }
        return user.getEmail();
    }
}
