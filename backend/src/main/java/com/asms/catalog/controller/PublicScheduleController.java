package com.asms.catalog.controller;

import com.asms.catalog.dto.CatalogDtos.BookingScheduleResponse;
import com.asms.catalog.service.PublicShowService;
import com.asms.core.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/schedules")
public class PublicScheduleController {

    private final PublicShowService publicShowService;

    public PublicScheduleController(PublicShowService publicShowService) {
        this.publicShowService = publicShowService;
    }

    @GetMapping("/{id}")
    public ApiResponse<BookingScheduleResponse> getSchedule(@PathVariable UUID id) {
        return ApiResponse.success("Schedule fetched successfully", publicShowService.getSchedule(id));
    }
}
