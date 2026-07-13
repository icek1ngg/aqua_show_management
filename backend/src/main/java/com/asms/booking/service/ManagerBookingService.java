package com.asms.booking.service;

import com.asms.booking.dto.ManagerBookingDtos.ManagerBookingDetailResponse;
import com.asms.booking.dto.ManagerBookingDtos.ManagerBookingResponse;
import com.asms.booking.dto.ManagerBookingDtos.PaymentDetail;
import com.asms.booking.dto.ManagerBookingDtos.TicketDetail;
import com.asms.booking.entity.Booking;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.repository.BookingRepository;
import com.asms.core.exception.NotFoundException;
import com.asms.core.response.PageResponse;
import com.asms.payment.entity.Payment;
import com.asms.payment.enums.PaymentStatus;
import com.asms.payment.repository.PaymentRepository;
import com.asms.ticketing.entity.Ticket;
import com.asms.ticketing.repository.TicketRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class ManagerBookingService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final TicketRepository ticketRepository;

    public ManagerBookingService(
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            TicketRepository ticketRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.ticketRepository = ticketRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<ManagerBookingResponse> getBookings(
            String showId,
            String scheduleId,
            BookingStatus status,
            Instant fromTime,
            Instant toTime,
            int page,
            int size
    ) {
        String normalizedShowId = normalize(showId);
        String normalizedScheduleId = normalize(scheduleId);
        Page<Booking> bookings = bookingRepository.searchForManager(
                normalizedShowId,
                normalizedScheduleId,
                status,
                fromTime,
                toTime,
                PageRequest.of(Math.max(page, 0), sanitizeSize(size)).withSort(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))
        );
        return PageResponse.from(bookings, bookings.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public ManagerBookingDetailResponse getBooking(UUID id) {
        Booking booking = bookingRepository.findById(id).orElseThrow(() -> new NotFoundException("Booking not found"));
        Payment payment = paymentRepository.findByBooking_Id(booking.getId()).orElse(null);
        return new ManagerBookingDetailResponse(
                toResponse(booking),
                payment == null ? null : toPaymentDetail(payment),
                ticketRepository.findByBooking_Id(booking.getId()).stream().map(this::toTicketDetail).toList()
        );
    }

    private ManagerBookingResponse toResponse(Booking booking) {
        PaymentStatus paymentStatus = paymentRepository.findByBooking_Id(booking.getId())
                .map(Payment::getStatus)
                .orElse(null);
        return new ManagerBookingResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getShowId(),
                booking.getScheduleId(),
                booking.getShowName(),
                booking.getShowDate(),
                booking.getUser().getEmail(),
                booking.getUser().getFullName(),
                booking.getQuantity(),
                booking.getTotalAmount(),
                booking.getStatus(),
                paymentStatus,
                booking.getCreatedAt(),
                booking.getExpiresAt()
        );
    }

    private PaymentDetail toPaymentDetail(Payment payment) {
        return new PaymentDetail(
                payment.getId(),
                payment.getPayosOrderCode(),
                payment.getTransactionId(),
                payment.getAmount(),
                payment.getStatus(),
                payment.getPaidAt(),
                payment.getCreatedAt()
        );
    }

    private TicketDetail toTicketDetail(Ticket ticket) {
        return new TicketDetail(ticket.getId(), ticket.getQrCode(), ticket.getStatus(), ticket.getIssuedAt(), ticket.getUsedAt());
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private int sanitizeSize(int size) {
        if (size <= 0) {
            return 10;
        }
        return Math.min(size, 100);
    }
}
