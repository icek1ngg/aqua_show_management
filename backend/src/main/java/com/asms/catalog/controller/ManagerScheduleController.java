package com.asms.catalog.controller;

import com.asms.catalog.dto.CatalogDtos.CreateScheduleRequest;
import com.asms.catalog.dto.CatalogDtos.ScheduleManagementResponse;
import com.asms.catalog.dto.CatalogDtos.UpdateScheduleRequest;
import com.asms.catalog.enums.ScheduleStatus;
import com.asms.catalog.service.ScheduleService;
import com.asms.core.response.ApiResponse;
import com.asms.core.response.PageResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/manager/schedules")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class ManagerScheduleController {

    private final ScheduleService scheduleService;

    public ManagerScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping
    public ApiResponse<PageResponse<ScheduleManagementResponse>> getSchedules(
            @RequestParam(required = false) UUID showId,
            @RequestParam(required = false) UUID venueId,
            @RequestParam(required = false) ScheduleStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toTime,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success("Schedules fetched successfully", scheduleService.getSchedules(showId, venueId, status, fromTime, toTime, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<ScheduleManagementResponse> getSchedule(@PathVariable UUID id) {
        return ApiResponse.success("Schedule fetched successfully", scheduleService.getSchedule(id));
    }

    @PostMapping
    public ApiResponse<ScheduleManagementResponse> createSchedule(@Valid @RequestBody CreateScheduleRequest request) {
        return ApiResponse.success("Schedule created successfully", scheduleService.createSchedule(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<ScheduleManagementResponse> updateSchedule(@PathVariable UUID id, @Valid @RequestBody UpdateScheduleRequest request) {
        return ApiResponse.success("Schedule updated successfully", scheduleService.updateSchedule(id, request));
    }

    @PatchMapping("/{id}/activate")
    public ApiResponse<Void> activateSchedule(@PathVariable UUID id) {
        scheduleService.activateSchedule(id);
        return ApiResponse.success("Schedule activated successfully");
    }

    @PatchMapping("/{id}/deactivate")
    public ApiResponse<Void> deactivateSchedule(@PathVariable UUID id) {
        scheduleService.deactivateSchedule(id);
        return ApiResponse.success("Schedule deactivated successfully");
    }
}
