package com.asms.booking.service;

import com.asms.booking.dto.BookingDtos.BookingResponse;
import com.asms.booking.dto.BookingDtos.CreateBookingRequest;
import com.asms.booking.dto.BookingDtos.CreateBookingResponse;
import com.asms.booking.dto.BookingDtos.PageBookingResponse;

import java.util.UUID;

public interface BookingService {

    CreateBookingResponse createBooking(CreateBookingRequest request, String currentUserEmail);

    PageBookingResponse getMyBookings(String currentUserEmail, int page, int size);

    BookingResponse getBookingDetail(UUID id, String currentUserEmail);

    BookingResponse getBookingByHoldId(String holdId, String currentUserEmail);
}
