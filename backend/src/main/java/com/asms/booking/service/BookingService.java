package com.asms.booking.service;

import com.asms.booking.dto.BookingDtos.BookingResponse;
import com.asms.booking.dto.BookingDtos.CreateBookingRequest;
import com.asms.booking.dto.BookingDtos.CreateBookingResponse;

import java.util.List;
import java.util.UUID;

public interface BookingService {

    CreateBookingResponse createBooking(CreateBookingRequest request, String currentUserEmail);

    List<BookingResponse> getMyBookings(String currentUserEmail);

    BookingResponse getBookingDetail(UUID id, String currentUserEmail);

    BookingResponse getBookingByHoldId(String holdId, String currentUserEmail);
}
