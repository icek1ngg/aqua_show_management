package com.asms.reporting.dto;

import com.asms.booking.enums.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class ReportDtos {

    private ReportDtos() {
    }

    public record DashboardReportResponse(
            long totalBookings,
            long paidBookings,
            long expiredBookings,
            long failedBookings,
            long totalTicketsSold,
            BigDecimal totalRevenue,
            long totalCheckIns,
            double attendanceRate
    ) {
    }

    public record SalesReportResponse(
            BigDecimal totalRevenue,
            long totalTicketsSold,
            List<SalesByShow> revenueByShow
    ) {
    }

    public record SalesByShow(
            String showId,
            String showName,
            BigDecimal revenue,
            long ticketsSold
    ) {
    }

    public record AttendanceReportResponse(
            long totalValidTickets,
            long totalUsedTickets,
            long noShowCount,
            double checkInRate
    ) {
    }

    public record BookingStatusReportResponse(
            Map<BookingStatus, Long> counts
    ) {
    }

    public record ReportFilter(
            LocalDate fromDate,
            LocalDate toDate,
            String showId,
            String scheduleId
    ) {
    }
}
