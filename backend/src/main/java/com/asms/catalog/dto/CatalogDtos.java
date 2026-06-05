package com.asms.catalog.dto;

import com.asms.catalog.enums.ScheduleStatus;
import com.asms.catalog.enums.ShowStatus;
import com.asms.catalog.enums.VenueStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public final class CatalogDtos {

    private CatalogDtos() {
    }

    public record ShowListItemResponse(
            UUID id,
            String title,
            String imageUrl,
            String shortDescription,
            Integer durationMinutes,
            LocalDateTime nextStartTime,
            String venueName
    ) {
    }

    public record ShowDetailResponse(
            UUID id,
            String title,
            String description,
            String imageUrl,
            Integer durationMinutes,
            ShowStatus status,
            List<ScheduleBriefResponse> schedules
    ) {
    }

    public record ScheduleBriefResponse(
            UUID id,
            LocalDateTime startTime,
            LocalDateTime endTime,
            String venueName,
            Integer availableTickets,
            BigDecimal price
    ) {
    }

    public record CreateShowRequest(
            @NotBlank(message = "Title is required")
            @Size(max = 150, message = "Title must not exceed 150 characters")
            String title,

            @NotBlank(message = "Description is required")
            String description,

            @Size(max = 1000, message = "Image URL must not exceed 1000 characters")
            String imageUrl,

            @NotNull(message = "Duration is required")
            @Min(value = 1, message = "Duration must be greater than 0")
            Integer durationMinutes
    ) {
    }

    public record UpdateShowRequest(
            @Size(max = 150, message = "Title must not exceed 150 characters")
            String title,
            String description,
            @Size(max = 1000, message = "Image URL must not exceed 1000 characters")
            String imageUrl,
            @Min(value = 1, message = "Duration must be greater than 0")
            Integer durationMinutes,
            ShowStatus status
    ) {
    }

    public record ShowManagementResponse(
            UUID id,
            String title,
            String description,
            String imageUrl,
            Integer durationMinutes,
            ShowStatus status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }

    public record CreateVenueRequest(
            @NotBlank(message = "Venue name is required")
            @Size(max = 150, message = "Venue name must not exceed 150 characters")
            String name,

            @NotBlank(message = "Location is required")
            @Size(max = 255, message = "Location must not exceed 255 characters")
            String location,

            @NotNull(message = "Capacity is required")
            @Min(value = 1, message = "Capacity must be greater than 0")
            Integer capacity
    ) {
    }

    public record UpdateVenueRequest(
            @Size(max = 150, message = "Venue name must not exceed 150 characters")
            String name,
            @Size(max = 255, message = "Location must not exceed 255 characters")
            String location,
            @Min(value = 1, message = "Capacity must be greater than 0")
            Integer capacity,
            VenueStatus status
    ) {
    }

    public record VenueResponse(
            UUID id,
            String name,
            String location,
            Integer capacity,
            VenueStatus status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }

    public record CreateScheduleRequest(
            @NotNull(message = "Show ID is required")
            UUID showId,
            @NotNull(message = "Venue ID is required")
            UUID venueId,
            @NotNull(message = "Start time is required")
            LocalDateTime startTime,
            @NotNull(message = "End time is required")
            LocalDateTime endTime,
            @NotNull(message = "Capacity is required")
            @Min(value = 1, message = "Capacity must be greater than 0")
            Integer capacity,
            @NotNull(message = "Price is required")
            @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
            BigDecimal price
    ) {
    }

    public record UpdateScheduleRequest(
            UUID venueId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            @Min(value = 1, message = "Capacity must be greater than 0")
            Integer capacity,
            @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
            BigDecimal price,
            ScheduleStatus status
    ) {
    }

    public record ScheduleManagementResponse(
            UUID id,
            UUID showId,
            String showTitle,
            UUID venueId,
            String venueName,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Integer capacity,
            Integer availableTickets,
            BigDecimal price,
            ScheduleStatus status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }
}
