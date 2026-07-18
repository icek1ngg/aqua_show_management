package com.asms.catalog.service;

import com.asms.catalog.dto.CatalogDtos.BookingScheduleResponse;
import com.asms.catalog.dto.CatalogDtos.ScheduleBriefResponse;
import com.asms.catalog.dto.CatalogDtos.ScheduleManagementResponse;
import com.asms.catalog.dto.CatalogDtos.ShowDetailResponse;
import com.asms.catalog.dto.CatalogDtos.ShowManagementResponse;
import com.asms.catalog.dto.CatalogDtos.UpcomingScheduleResponse;
import com.asms.catalog.dto.CatalogDtos.VenueResponse;
import com.asms.catalog.entity.Show;
import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.entity.Venue;
import jakarta.persistence.EntityNotFoundException;
import org.hibernate.ObjectNotFoundException;

import java.math.BigDecimal;
import java.util.List;

final class CatalogMapper {

    private CatalogMapper() {
    }

    static ShowManagementResponse toShowManagement(Show show) {
        return new ShowManagementResponse(
                show.getId(),
                show.getTitle(),
                show.getDescription(),
                show.getImageUrl(),
                show.getDurationMinutes(),
                show.getStatus(),
                show.getCreatedAt(),
                show.getUpdatedAt()
        );
    }

    static ShowDetailResponse toShowDetail(Show show, List<ShowSchedule> schedules) {
        return new ShowDetailResponse(
                show.getId(),
                show.getTitle(),
                show.getDescription(),
                show.getImageUrl(),
                show.getDurationMinutes(),
                show.getStatus(),
                schedules.stream().map(CatalogMapper::toScheduleBrief).toList()
        );
    }

    static ScheduleBriefResponse toScheduleBrief(ShowSchedule schedule) {
        return new ScheduleBriefResponse(
                schedule.getId(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                venueName(schedule),
                schedule.getTotalAvailableTickets(),
                schedule.getStandardPrice()
        );
    }

    static UpcomingScheduleResponse toUpcomingSchedule(ShowSchedule schedule) {
        Show show = schedule.getShow();
        return new UpcomingScheduleResponse(
                schedule.getId(),
                show.getId(),
                show.getTitle(),
                show.getImageUrl(),
                shortDescription(show.getDescription()),
                show.getDurationMinutes(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                venueName(schedule)
        );
    }

    static BookingScheduleResponse toBookingSchedule(
            ShowSchedule schedule,
            BigDecimal standardPrice,
            BigDecimal vipPrice,
            BigDecimal familyPrice,
            int standardAvailableTickets,
            int vipAvailableTickets,
            int familyAvailableTickets
    ) {
        Show show = schedule.getShow();
        Venue venue = venue(schedule);
        return new BookingScheduleResponse(
                schedule.getId(),
                show.getId(),
                show.getTitle(),
                show.getDescription(),
                show.getImageUrl(),
                schedule.getStatus(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                venue == null ? null : venue.getId(),
                venue == null ? null : venue.getName(),
                venue == null ? null : venue.getLocation(),
                standardPrice,
                vipPrice,
                familyPrice,
                schedule.getStandardCapacity(),
                schedule.getVipCapacity(),
                schedule.getFamilyCapacity(),
                standardAvailableTickets,
                vipAvailableTickets,
                familyAvailableTickets
        );
    }

    static VenueResponse toVenue(Venue venue) {
        return new VenueResponse(
                venue.getId(),
                venue.getName(),
                venue.getLocation(),
                venue.getCapacity(),
                venue.getStatus(),
                venue.getCreatedAt(),
                venue.getUpdatedAt()
        );
    }

    static ScheduleManagementResponse toScheduleManagement(ShowSchedule schedule) {
        Venue venue = venue(schedule);
        return new ScheduleManagementResponse(
                schedule.getId(),
                schedule.getShow().getId(),
                schedule.getShow().getTitle(),
                venue == null ? null : venue.getId(),
                venue == null ? null : venue.getName(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getStandardCapacity(),
                schedule.getVipCapacity(),
                schedule.getFamilyCapacity(),
                schedule.getTotalCapacity(),
                schedule.getStandardAvailableTickets(),
                schedule.getVipAvailableTickets(),
                schedule.getFamilyAvailableTickets(),
                schedule.getTotalAvailableTickets(),
                schedule.getStandardPrice(),
                schedule.getStatus(),
                schedule.getCreatedAt(),
                schedule.getUpdatedAt()
        );
    }

    static String venueName(ShowSchedule schedule) {
        Venue venue = venue(schedule);
        return venue == null ? null : venue.getName();
    }

    private static String shortDescription(String description) {
        if (description == null || description.length() <= 140) {
            return description;
        }
        return description.substring(0, 137) + "...";
    }

    private static Venue venue(ShowSchedule schedule) {
        try {
            return schedule.getVenue();
        } catch (EntityNotFoundException | ObjectNotFoundException exception) {
            return null;
        }
    }
}
