package com.asms.booking.controller;

import com.asms.booking.dto.ManagerBookingDtos.ManagerBookingDetailResponse;
import com.asms.booking.dto.ManagerBookingDtos.ManagerBookingResponse;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.service.ManagerBookingService;
import com.asms.core.response.ApiResponse;
import com.asms.core.response.PageResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/manager/bookings")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class ManagerBookingController {

    private final ManagerBookingService managerBookingService;

    public ManagerBookingController(ManagerBookingService managerBookingService) {
        this.managerBookingService = managerBookingService;
    }

    @GetMapping
    public ApiResponse<PageResponse<ManagerBookingResponse>> getBookings(
            @RequestParam(required = false) String showId,
            @RequestParam(required = false) String scheduleId,
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toTime,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success("Bookings fetched successfully", managerBookingService.getBookings(showId, scheduleId, status, fromTime, toTime, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<ManagerBookingDetailResponse> getBooking(@PathVariable UUID id) {
        return ApiResponse.success("Booking fetched successfully", managerBookingService.getBooking(id));
    }
}
