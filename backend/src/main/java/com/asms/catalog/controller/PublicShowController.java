package com.asms.catalog.controller;

import com.asms.catalog.dto.CatalogDtos.ShowDetailResponse;
import com.asms.catalog.dto.CatalogDtos.ShowListItemResponse;
import com.asms.catalog.dto.CatalogDtos.ScheduleBriefResponse;
import com.asms.catalog.service.PublicShowService;
import com.asms.core.response.ApiResponse;
import com.asms.core.response.PageResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/shows")
public class PublicShowController {

    private final PublicShowService publicShowService;

    public PublicShowController(PublicShowService publicShowService) {
        this.publicShowService = publicShowService;
    }

    @GetMapping
    public ApiResponse<PageResponse<ShowListItemResponse>> getShows(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success("Shows fetched successfully", publicShowService.getActiveShows(keyword, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<ShowDetailResponse> getShow(@PathVariable UUID id) {
        return ApiResponse.success("Show fetched successfully", publicShowService.getShowDetail(id));
    }

    @GetMapping("/{id}/schedules")
    public ApiResponse<List<ScheduleBriefResponse>> getShowSchedules(@PathVariable UUID id) {
        return ApiResponse.success("Schedules fetched successfully", publicShowService.getActiveSchedulesByShow(id));
    }

}
