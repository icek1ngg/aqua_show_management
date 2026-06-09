package com.asms.catalog.controller;

import com.asms.catalog.dto.CatalogDtos.CreateShowRequest;
import com.asms.catalog.dto.CatalogDtos.ShowManagementResponse;
import com.asms.catalog.dto.CatalogDtos.UpdateShowRequest;
import com.asms.catalog.enums.ShowStatus;
import com.asms.catalog.service.ShowService;
import com.asms.core.response.ApiResponse;
import com.asms.core.response.PageResponse;
import jakarta.validation.Valid;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/manager/shows")
@PreAuthorize("hasRole('MANAGER')")
public class ManagerShowController {

    private final ShowService showService;

    public ManagerShowController(ShowService showService) {
        this.showService = showService;
    }

    @GetMapping
    public ApiResponse<PageResponse<ShowManagementResponse>> getShows(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ShowStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success("Shows fetched successfully", showService.getShows(keyword, status, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<ShowManagementResponse> getShow(@PathVariable UUID id) {
        return ApiResponse.success("Show fetched successfully", showService.getShow(id));
    }

    @PostMapping
    public ApiResponse<ShowManagementResponse> createShow(@Valid @RequestBody CreateShowRequest request) {
        return ApiResponse.success("Show created successfully", showService.createShow(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<ShowManagementResponse> updateShow(@PathVariable UUID id, @Valid @RequestBody UpdateShowRequest request) {
        return ApiResponse.success("Show updated successfully", showService.updateShow(id, request));
    }

    @PatchMapping("/{id}/activate")
    public ApiResponse<Void> activateShow(@PathVariable UUID id) {
        showService.activateShow(id);
        return ApiResponse.success("Show activated successfully");
    }

    @PatchMapping("/{id}/deactivate")
    public ApiResponse<Void> deactivateShow(@PathVariable UUID id) {
        showService.deactivateShow(id);
        return ApiResponse.success("Show deactivated successfully");
    }
}
