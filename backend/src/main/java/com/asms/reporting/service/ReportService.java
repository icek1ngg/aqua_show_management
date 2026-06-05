package com.asms.reporting.service;

import com.asms.booking.entity.Booking;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.repository.BookingRepository;
import com.asms.core.exception.BadRequestException;
import com.asms.reporting.dto.ReportDtos.AttendanceReportResponse;
import com.asms.reporting.dto.ReportDtos.BookingStatusReportResponse;
import com.asms.reporting.dto.ReportDtos.DashboardReportResponse;
import com.asms.reporting.dto.ReportDtos.ReportFilter;
import com.asms.reporting.dto.ReportDtos.SalesByShow;
import com.asms.reporting.dto.ReportDtos.SalesReportResponse;
import com.asms.ticketing.enums.TicketStatus;
import com.asms.ticketing.repository.CheckInLogRepository;
import com.asms.ticketing.repository.TicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final CheckInLogRepository checkInLogRepository;

    public ReportService(
            BookingRepository bookingRepository,
            TicketRepository ticketRepository,
            CheckInLogRepository checkInLogRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.ticketRepository = ticketRepository;
        this.checkInLogRepository = checkInLogRepository;
    }

    @Transactional(readOnly = true)
    public DashboardReportResponse getDashboardReport(ReportFilter filter) {
        List<Booking> bookings = filteredBookings(validate(filter));
        long paidBookings = bookings.stream().filter((booking) -> booking.getStatus() == BookingStatus.PAID).count();
        long expiredBookings = bookings.stream().filter((booking) -> booking.getStatus() == BookingStatus.EXPIRED).count();
        long failedBookings = bookings.stream().filter((booking) -> booking.getStatus() == BookingStatus.FAILED).count();
        long ticketsSold = bookings.stream()
                .filter((booking) -> booking.getStatus() == BookingStatus.PAID)
                .mapToLong(Booking::getQuantity)
                .sum();
        BigDecimal revenue = bookings.stream()
                .filter((booking) -> booking.getStatus() == BookingStatus.PAID)
                .map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long usedTickets = ticketRepository.findAll().stream().filter((ticket) -> ticket.getStatus() == TicketStatus.USED).count();

        return new DashboardReportResponse(
                bookings.size(),
                paidBookings,
                expiredBookings,
                failedBookings,
                ticketsSold,
                revenue,
                checkInLogRepository.count(),
                ratio(usedTickets, ticketsSold)
        );
    }

    @Transactional(readOnly = true)
    public SalesReportResponse getSalesReport(ReportFilter filter) {
        List<Booking> paidBookings = filteredBookings(validate(filter)).stream()
                .filter((booking) -> booking.getStatus() == BookingStatus.PAID)
                .toList();
        BigDecimal totalRevenue = paidBookings.stream().map(Booking::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        long totalTicketsSold = paidBookings.stream().mapToLong(Booking::getQuantity).sum();
        List<SalesByShow> byShow = paidBookings.stream()
                .collect(Collectors.groupingBy(Booking::getShowId))
                .entrySet()
                .stream()
                .map((entry) -> {
                    List<Booking> group = entry.getValue();
                    return new SalesByShow(
                            entry.getKey(),
                            group.get(0).getShowName(),
                            group.stream().map(Booking::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add),
                            group.stream().mapToLong(Booking::getQuantity).sum()
                    );
                })
                .toList();
        return new SalesReportResponse(totalRevenue, totalTicketsSold, byShow);
    }

    @Transactional(readOnly = true)
    public AttendanceReportResponse getAttendanceReport(ReportFilter filter) {
        List<Booking> paidBookings = filteredBookings(validate(filter)).stream()
                .filter((booking) -> booking.getStatus() == BookingStatus.PAID)
                .toList();
        long ticketTotal = paidBookings.stream().mapToLong(Booking::getQuantity).sum();
        long usedTickets = ticketRepository.findAll().stream()
                .filter((ticket) -> ticket.getStatus() == TicketStatus.USED)
                .filter((ticket) -> paidBookings.stream().anyMatch((booking) -> booking.getId().equals(ticket.getBooking().getId())))
                .count();
        return new AttendanceReportResponse(ticketTotal, usedTickets, Math.max(0, ticketTotal - usedTickets), ratio(usedTickets, ticketTotal));
    }

    @Transactional(readOnly = true)
    public BookingStatusReportResponse getBookingStatusReport(ReportFilter filter) {
        Map<BookingStatus, Long> counts = new EnumMap<>(BookingStatus.class);
        for (BookingStatus status : BookingStatus.values()) {
            counts.put(status, 0L);
        }
        filteredBookings(validate(filter)).forEach((booking) -> counts.computeIfPresent(booking.getStatus(), (key, value) -> value + 1));
        return new BookingStatusReportResponse(counts);
    }

    private List<Booking> filteredBookings(ReportFilter filter) {
        Instant from = filter.fromDate() == null ? null : filter.fromDate().atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant to = filter.toDate() == null ? null : filter.toDate().plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        return bookingRepository.findAll()
                .stream()
                .filter((booking) -> filter.showId() == null || filter.showId().equals(booking.getShowId()))
                .filter((booking) -> filter.scheduleId() == null || filter.scheduleId().equals(booking.getScheduleId()))
                .filter((booking) -> from == null || !booking.getCreatedAt().isBefore(from))
                .filter((booking) -> to == null || booking.getCreatedAt().isBefore(to))
                .toList();
    }

    private ReportFilter validate(ReportFilter filter) {
        if (filter.fromDate() != null && filter.toDate() != null && filter.fromDate().isAfter(filter.toDate())) {
            throw new BadRequestException("From date must be before to date");
        }
        return filter;
    }

    private double ratio(long value, long total) {
        if (total <= 0) {
            return 0;
        }
        return Math.round((value * 10000.0 / total)) / 100.0;
    }
}
