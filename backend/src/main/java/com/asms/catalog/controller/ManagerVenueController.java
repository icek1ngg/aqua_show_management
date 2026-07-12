package com.asms.catalog.controller;

import com.asms.catalog.dto.CatalogDtos.CreateVenueRequest;
import com.asms.catalog.dto.CatalogDtos.UpdateVenueRequest;
import com.asms.catalog.dto.CatalogDtos.VenueResponse;
import com.asms.catalog.enums.VenueStatus;
import com.asms.catalog.service.VenueService;
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
@RequestMapping("/api/manager/venues")
public class ManagerVenueController {

    private final VenueService venueService;

    public ManagerVenueController(VenueService venueService) {
        this.venueService = venueService;
    }

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<PageResponse<VenueResponse>> getVenues(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) VenueStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success("Venues fetched successfully", venueService.getVenues(keyword, status, page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<VenueResponse> getVenue(@PathVariable UUID id) {
        return ApiResponse.success("Venue fetched successfully", venueService.getVenue(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<VenueResponse> createVenue(@Valid @RequestBody CreateVenueRequest request) {
        return ApiResponse.success("Venue created successfully", venueService.createVenue(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<VenueResponse> updateVenue(@PathVariable UUID id, @Valid @RequestBody UpdateVenueRequest request) {
        return ApiResponse.success("Venue updated successfully", venueService.updateVenue(id, request));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<Void> activateVenue(@PathVariable UUID id) {
        venueService.activateVenue(id);
        return ApiResponse.success("Venue activated successfully");
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<Void> deactivateVenue(@PathVariable UUID id) {
        venueService.deactivateVenue(id);
        return ApiResponse.success("Venue deactivated successfully");
    }
}
