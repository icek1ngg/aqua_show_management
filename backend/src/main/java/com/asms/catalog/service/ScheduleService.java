package com.asms.catalog.service;

import com.asms.booking.enums.BookingStatus;
import com.asms.booking.repository.BookingRepository;
import com.asms.catalog.dto.CatalogDtos.CreateScheduleRequest;
import com.asms.catalog.dto.CatalogDtos.ScheduleManagementResponse;
import com.asms.catalog.dto.CatalogDtos.UpdateScheduleRequest;
import com.asms.catalog.entity.Show;
import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.entity.Venue;
import com.asms.catalog.enums.ScheduleStatus;
import com.asms.catalog.enums.ShowStatus;
import com.asms.catalog.enums.VenueStatus;
import com.asms.catalog.repository.ShowRepository;
import com.asms.catalog.repository.ShowScheduleRepository;
import com.asms.catalog.repository.VenueRepository;
import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.ConflictException;
import com.asms.core.exception.NotFoundException;
import com.asms.core.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ScheduleService {

    private final ShowScheduleRepository scheduleRepository;
    private final ShowRepository showRepository;
    private final VenueRepository venueRepository;
    private final BookingRepository bookingRepository;
    private final CatalogCacheService cacheService;

    public ScheduleService(
            ShowScheduleRepository scheduleRepository,
            ShowRepository showRepository,
            VenueRepository venueRepository,
            BookingRepository bookingRepository,
            CatalogCacheService cacheService
    ) {
        this.scheduleRepository = scheduleRepository;
        this.showRepository = showRepository;
        this.venueRepository = venueRepository;
        this.bookingRepository = bookingRepository;
        this.cacheService = cacheService;
    }

    @Transactional(readOnly = true)
    public PageResponse<ScheduleManagementResponse> getSchedules(
            UUID showId,
            UUID venueId,
            ScheduleStatus status,
            LocalDateTime fromTime,
            LocalDateTime toTime,
            int page,
            int size
    ) {
        Page<ShowSchedule> schedules = scheduleRepository.findAll(
                scheduleSpecification(showId, venueId, status, fromTime, toTime),
                PageRequest.of(Math.max(page, 0), sanitizeSize(size), Sort.by(Sort.Direction.DESC, "startTime"))
        );
        return PageResponse.from(schedules, schedules.getContent().stream().map(CatalogMapper::toScheduleManagement).toList());
    }

    @Transactional(readOnly = true)
    public ScheduleManagementResponse getSchedule(UUID id) {
        return scheduleRepository.findById(id)
                .map(CatalogMapper::toScheduleManagement)
                .orElseThrow(() -> new NotFoundException("Schedule not found"));
    }

    @Transactional
    public ScheduleManagementResponse createSchedule(CreateScheduleRequest request) {
        Show show = showRepository.findByIdAndStatus(request.showId(), ShowStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException("Show not found"));
        Venue venue = venueRepository.findByIdAndStatus(request.venueId(), VenueStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException("Venue not found"));
        validateSchedule(null, venue, request.startTime(), request.endTime(), request.capacity());
        ShowSchedule schedule = scheduleRepository.save(new ShowSchedule(show, venue, request.startTime(), request.endTime(), request.capacity(), normalizePrice(request.price())));
        cacheService.invalidateScheduleCache(show.getId(), schedule.getId());
        return CatalogMapper.toScheduleManagement(schedule);
    }

    @Transactional
    public ScheduleManagementResponse updateSchedule(UUID id, UpdateScheduleRequest request) {
        ShowSchedule schedule = scheduleRepository.findById(id).orElseThrow(() -> new NotFoundException("Schedule not found"));
        Venue venue = schedule.getVenue();
        if (request.venueId() != null) {
            venue = venueRepository.findByIdAndStatus(request.venueId(), VenueStatus.ACTIVE)
                    .orElseThrow(() -> new NotFoundException("Venue not found"));
        }
        LocalDateTime startTime = request.startTime() == null ? schedule.getStartTime() : request.startTime();
        LocalDateTime endTime = request.endTime() == null ? schedule.getEndTime() : request.endTime();
        int newCapacity = request.capacity() == null ? schedule.getCapacity() : request.capacity();

        validateSchedule(schedule.getId(), venue, startTime, endTime, newCapacity);
        validateCapacityAgainstPaidTickets(schedule.getId(), newCapacity);

        int soldTickets = schedule.getCapacity() - schedule.getAvailableTickets();
        schedule.setVenue(venue);
        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);
        schedule.setCapacity(newCapacity);
        schedule.setAvailableTickets(Math.max(0, newCapacity - Math.max(0, soldTickets)));
        if (request.price() != null) {
            schedule.setPrice(normalizePrice(request.price()));
        }
        if (request.status() != null) {
            schedule.setStatus(request.status());
        }
        cacheService.invalidateScheduleCache(schedule.getShow().getId(), schedule.getId());
        return CatalogMapper.toScheduleManagement(schedule);
    }

    @Transactional
    public void activateSchedule(UUID id) {
        setStatus(id, ScheduleStatus.ACTIVE);
    }

    @Transactional
    public void deactivateSchedule(UUID id) {
        ShowSchedule schedule = scheduleRepository.findById(id).orElseThrow(() -> new NotFoundException("Schedule not found"));
        if (bookingRepository.countByScheduleIdAndStatus(schedule.getId().toString(), BookingStatus.PAID) > 0) {
            throw new ConflictException("Cannot deactivate a schedule with paid bookings");
        }
        schedule.setStatus(ScheduleStatus.INACTIVE);
        cacheService.invalidateScheduleCache(schedule.getShow().getId(), schedule.getId());
    }

    private void setStatus(UUID id, ScheduleStatus status) {
        ShowSchedule schedule = scheduleRepository.findById(id).orElseThrow(() -> new NotFoundException("Schedule not found"));
        schedule.setStatus(status);
        cacheService.invalidateScheduleCache(schedule.getShow().getId(), schedule.getId());
    }

    private void validateSchedule(UUID scheduleId, Venue venue, LocalDateTime startTime, LocalDateTime endTime, int capacity) {
        if (!startTime.isBefore(endTime)) {
            throw new BadRequestException("Start time must be before end time");
        }
        if (startTime.isBefore(LocalDateTime.now().plusHours(24))) {
            throw new BadRequestException("Schedules must be created at least 24 hours before start time");
        }
        if (capacity > venue.getCapacity()) {
            throw new BadRequestException("Schedule capacity cannot exceed venue capacity");
        }
        if (scheduleRepository.existsVenueConflict(venue.getId(), startTime, endTime, scheduleId)) {
            throw new ConflictException("Venue already has a schedule in this time slot");
        }
    }

    private void validateCapacityAgainstPaidTickets(UUID scheduleId, int capacity) {
        long paidTickets = bookingRepository.countPaidTicketsByScheduleId(scheduleId.toString());
        if (capacity < paidTickets) {
            throw new BadRequestException("Capacity cannot be lower than paid ticket quantity");
        }
    }

    private BigDecimal normalizePrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Price must be greater than 0");
        }
        return price;
    }

    private int sanitizeSize(int size) {
        if (size <= 0) {
            return 10;
        }
        return Math.min(size, 100);
    }

    private Specification<ShowSchedule> scheduleSpecification(
            UUID showId,
            UUID venueId,
            ScheduleStatus status,
            LocalDateTime fromTime,
            LocalDateTime toTime
    ) {
        return (root, query, criteriaBuilder) -> {
            var predicate = criteriaBuilder.conjunction();

            if (showId != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("show").get("id"), showId));
            }
            if (venueId != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("venue").get("id"), venueId));
            }
            if (status != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("status"), status));
            }
            if (fromTime != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.greaterThanOrEqualTo(root.get("startTime"), fromTime));
            }
            if (toTime != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.lessThanOrEqualTo(root.get("startTime"), toTime));
            }

            return predicate;
        };
    }
}
