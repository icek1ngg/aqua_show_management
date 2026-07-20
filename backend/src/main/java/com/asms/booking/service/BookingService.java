package com.asms.booking.service;

import com.asms.booking.dto.BookingDtos.BookingResponse;
import com.asms.booking.dto.BookingDtos.CreateBookingRequest;
import com.asms.booking.dto.BookingDtos.CreateBookingResponse;
import com.asms.booking.dto.BookingDtos.PageBookingResponse;

import java.util.UUID;

public interface BookingService {

    CreateBookingResponse createBooking(CreateBookingRequest request, String currentUserEmail);

    PageBookingResponse getMyBookings(String currentUserEmail, int page, int size, String keyword, String status);

    default PageBookingResponse getMyBookings(String currentUserEmail, int page, int size) {
        return getMyBookings(currentUserEmail, page, size, null, null);
    }

    BookingResponse getBookingDetail(UUID id, String currentUserEmail);

    BookingResponse getBookingByHoldId(String holdId, String currentUserEmail);
}
