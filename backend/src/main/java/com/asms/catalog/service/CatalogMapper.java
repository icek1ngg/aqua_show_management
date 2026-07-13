package com.asms.catalog.service;

import com.asms.catalog.dto.CatalogDtos.ScheduleBriefResponse;
import com.asms.catalog.dto.CatalogDtos.ScheduleManagementResponse;
import com.asms.catalog.dto.CatalogDtos.ShowDetailResponse;
import com.asms.catalog.dto.CatalogDtos.ShowManagementResponse;
import com.asms.catalog.dto.CatalogDtos.VenueResponse;
import com.asms.catalog.entity.Show;
import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.entity.Venue;
import jakarta.persistence.EntityNotFoundException;
import org.hibernate.ObjectNotFoundException;

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

    private static Venue venue(ShowSchedule schedule) {
        try {
            return schedule.getVenue();
        } catch (EntityNotFoundException | ObjectNotFoundException exception) {
            return null;
        }
    }
}
