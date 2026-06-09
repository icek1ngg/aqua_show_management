package com.asms.reporting.controller;

import com.asms.core.response.ApiResponse;
import com.asms.reporting.dto.ReportDtos.AttendanceReportResponse;
import com.asms.reporting.dto.ReportDtos.BookingStatusReportResponse;
import com.asms.reporting.dto.ReportDtos.DashboardReportResponse;
import com.asms.reporting.dto.ReportDtos.ReportFilter;
import com.asms.reporting.dto.ReportDtos.SalesReportResponse;
import com.asms.reporting.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/manager/reports")
@PreAuthorize("hasRole('MANAGER')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping({"/dashboard", "/bookings"})
    public ApiResponse<DashboardReportResponse> dashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String showId,
            @RequestParam(required = false) String scheduleId
    ) {
        return ApiResponse.success("Dashboard report fetched successfully", reportService.getDashboardReport(new ReportFilter(fromDate, toDate, normalize(showId), normalize(scheduleId))));
    }

    @GetMapping({"/sales", "/ticket-sales"})
    public ApiResponse<SalesReportResponse> sales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String showId,
            @RequestParam(required = false) String scheduleId
    ) {
        return ApiResponse.success("Sales report fetched successfully", reportService.getSalesReport(new ReportFilter(fromDate, toDate, normalize(showId), normalize(scheduleId))));
    }

    @GetMapping({"/attendance", "/check-ins"})
    public ApiResponse<AttendanceReportResponse> attendance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String showId,
            @RequestParam(required = false) String scheduleId
    ) {
        return ApiResponse.success("Attendance report fetched successfully", reportService.getAttendanceReport(new ReportFilter(fromDate, toDate, normalize(showId), normalize(scheduleId))));
    }

    @GetMapping("/booking-status")
    public ApiResponse<BookingStatusReportResponse> bookingStatus(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String showId,
            @RequestParam(required = false) String scheduleId
    ) {
        return ApiResponse.success("Booking status report fetched successfully", reportService.getBookingStatusReport(new ReportFilter(fromDate, toDate, normalize(showId), normalize(scheduleId))));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
