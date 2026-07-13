package com.asms.catalog.service;

import com.asms.booking.enums.BookingStatus;
import com.asms.booking.enums.TicketType;
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
        validateSchedule(null, venue, request.startTime(), request.endTime());
        validateTicketCapacities(venue, request.standardCapacity(), request.vipCapacity(), request.familyCapacity());
        ShowSchedule schedule = scheduleRepository.save(new ShowSchedule(
                show,
                venue,
                request.startTime(),
                request.endTime(),
                request.standardCapacity(),
                request.vipCapacity(),
                request.familyCapacity(),
                normalizePrice(request.standardPrice())
        ));
        cacheService.invalidateScheduleCache(show.getId(), schedule.getId());
        return CatalogMapper.toScheduleManagement(schedule);
    }

    @Transactional
    public ScheduleManagementResponse updateSchedule(UUID id, UpdateScheduleRequest request) {
        ShowSchedule schedule = scheduleRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Schedule not found"));
        Venue venue = schedule.getVenue();
        if (request.venueId() != null) {
            venue = venueRepository.findByIdAndStatus(request.venueId(), VenueStatus.ACTIVE)
                    .orElseThrow(() -> new NotFoundException("Venue not found"));
        }
        LocalDateTime startTime = request.startTime() == null ? schedule.getStartTime() : request.startTime();
        LocalDateTime endTime = request.endTime() == null ? schedule.getEndTime() : request.endTime();
        int standardCapacity = request.standardCapacity() == null
                ? schedule.getStandardCapacity()
                : request.standardCapacity();
        int vipCapacity = request.vipCapacity() == null
                ? schedule.getVipCapacity()
                : request.vipCapacity();
        int familyCapacity = request.familyCapacity() == null
                ? schedule.getFamilyCapacity()
                : request.familyCapacity();

        validateSchedule(schedule.getId(), venue, startTime, endTime);
        validateTicketCapacities(venue, standardCapacity, vipCapacity, familyCapacity);
        long paidStandard = paidTickets(schedule.getId(), TicketType.STANDARD);
        long paidVip = paidTickets(schedule.getId(), TicketType.VIP);
        long paidFamily = paidTickets(schedule.getId(), TicketType.FAMILY);
        validateCapacityAgainstPaidTickets(TicketType.STANDARD, standardCapacity, paidStandard);
        validateCapacityAgainstPaidTickets(TicketType.VIP, vipCapacity, paidVip);
        validateCapacityAgainstPaidTickets(TicketType.FAMILY, familyCapacity, paidFamily);

        int soldStandard = soldTickets(schedule.getStandardCapacity(), schedule.getStandardAvailableTickets(), paidStandard);
        int soldVip = soldTickets(schedule.getVipCapacity(), schedule.getVipAvailableTickets(), paidVip);
        int soldFamily = soldTickets(schedule.getFamilyCapacity(), schedule.getFamilyAvailableTickets(), paidFamily);
        validateCapacityAgainstSoldTickets(TicketType.STANDARD, standardCapacity, soldStandard);
        validateCapacityAgainstSoldTickets(TicketType.VIP, vipCapacity, soldVip);
        validateCapacityAgainstSoldTickets(TicketType.FAMILY, familyCapacity, soldFamily);

        schedule.setVenue(venue);
        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);
        schedule.setStandardCapacity(standardCapacity);
        schedule.setVipCapacity(vipCapacity);
        schedule.setFamilyCapacity(familyCapacity);
        schedule.setStandardAvailableTickets(standardCapacity - soldStandard);
        schedule.setVipAvailableTickets(vipCapacity - soldVip);
        schedule.setFamilyAvailableTickets(familyCapacity - soldFamily);
        if (request.standardPrice() != null) {
            schedule.setStandardPrice(normalizePrice(request.standardPrice()));
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
        ShowSchedule schedule = scheduleRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Schedule not found"));
        if (bookingRepository.countByScheduleIdAndStatus(schedule.getId().toString(), BookingStatus.PAID) > 0) {
            throw new ConflictException("Cannot deactivate a schedule with paid bookings");
        }
        schedule.setStatus(ScheduleStatus.INACTIVE);
        cacheService.invalidateScheduleCache(schedule.getShow().getId(), schedule.getId());
    }

    private void setStatus(UUID id, ScheduleStatus status) {
        ShowSchedule schedule = scheduleRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Schedule not found"));
        schedule.setStatus(status);
        cacheService.invalidateScheduleCache(schedule.getShow().getId(), schedule.getId());
    }

    private void validateSchedule(UUID scheduleId, Venue venue, LocalDateTime startTime, LocalDateTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new BadRequestException("Start time must be before end time");
        }
        if (startTime.isBefore(LocalDateTime.now().plusHours(24))) {
            throw new BadRequestException("Schedules must be created at least 24 hours before start time");
        }
        if (scheduleRepository.existsVenueConflict(venue.getId(), startTime, endTime, scheduleId)) {
            throw new ConflictException("Venue already has a schedule in this time slot");
        }
    }

    private void validateTicketCapacities(Venue venue, Integer standard, Integer vip, Integer family) {
        if (standard == null || vip == null || family == null) {
            throw new BadRequestException("Ticket capacities are required");
        }
        if (standard < 0 || vip < 0 || family < 0) {
            throw new BadRequestException("Ticket capacities must not be negative");
        }
        long total = (long) standard + vip + family;
        if (total <= 0) {
            throw new BadRequestException("Ticket capacity total must be greater than 0");
        }
        if (total > venue.getCapacity()) {
            throw new BadRequestException("Ticket capacity total cannot exceed venue capacity");
        }
    }

    private long paidTickets(UUID scheduleId, TicketType type) {
        return scheduleRepository.countPaidTicketsByScheduleIdAndTicketType(
                scheduleId.toString(),
                type.name()
        );
    }

    private void validateCapacityAgainstPaidTickets(TicketType type, int capacity, long paidTickets) {
        if (capacity < paidTickets) {
            throw new BadRequestException(typeLabel(type) + " capacity cannot be lower than paid ticket quantity");
        }
    }

    private int soldTickets(int capacity, int availableTickets, long paidTickets) {
        return (int) Math.max((long) capacity - availableTickets, paidTickets);
    }

    private void validateCapacityAgainstSoldTickets(TicketType type, int capacity, int soldTickets) {
        if (capacity < soldTickets) {
            throw new BadRequestException(typeLabel(type) + " capacity cannot be lower than sold ticket quantity");
        }
    }

    private String typeLabel(TicketType type) {
        return type == TicketType.VIP
                ? "VIP"
                : type.name().charAt(0) + type.name().substring(1).toLowerCase();
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
