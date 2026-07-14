package com.asms.catalog.service;

import com.asms.booking.enums.TicketType;
import com.asms.booking.service.RedisTicketHoldService;
import com.asms.booking.service.TicketPricingService;
import com.asms.catalog.dto.CatalogDtos.BookingScheduleResponse;
import com.asms.catalog.dto.CatalogDtos.ScheduleBriefResponse;
import com.asms.catalog.dto.CatalogDtos.ShowDetailResponse;
import com.asms.catalog.dto.CatalogDtos.ShowListItemResponse;
import com.asms.catalog.entity.Show;
import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.enums.ScheduleStatus;
import com.asms.catalog.enums.ShowStatus;
import com.asms.catalog.repository.ShowRepository;
import com.asms.catalog.repository.ShowScheduleRepository;
import com.asms.core.exception.NotFoundException;
import com.asms.core.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PublicShowService {

    private final ShowRepository showRepository;
    private final ShowScheduleRepository scheduleRepository;
    private final RedisTicketHoldService ticketHoldService;
    private final TicketPricingService ticketPricingService;

    public PublicShowService(
            ShowRepository showRepository,
            ShowScheduleRepository scheduleRepository,
            RedisTicketHoldService ticketHoldService,
            TicketPricingService ticketPricingService
    ) {
        this.showRepository = showRepository;
        this.scheduleRepository = scheduleRepository;
        this.ticketHoldService = ticketHoldService;
        this.ticketPricingService = ticketPricingService;
    }

    @Transactional(readOnly = true)
    public PageResponse<ShowListItemResponse> getActiveShows(String keyword, int page, int size) {
        String normalizedKeyword = normalizeKeyword(keyword);
        PageRequest pageRequest = PageRequest.of(Math.max(page, 0), sanitizeSize(size));
        Page<Show> shows = normalizedKeyword == null
                ? showRepository.findByStatusOrderByCreatedAtDesc(ShowStatus.ACTIVE, pageRequest)
                : showRepository.searchByKeyword(normalizedKeyword, ShowStatus.ACTIVE, pageRequest);
        return PageResponse.from(shows, shows.getContent().stream().map(this::toListItem).toList());
    }

    @Transactional(readOnly = true)
    public ShowDetailResponse getShowDetail(UUID showId) {
        Show show = showRepository.findByIdAndStatus(showId, ShowStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException("Show not found"));
        return CatalogMapper.toShowDetail(show, scheduleRepository.findByShow_IdAndStatusOrderByStartTimeAsc(show.getId(), ScheduleStatus.ACTIVE));
    }

    @Transactional(readOnly = true)
    public List<ScheduleBriefResponse> getActiveSchedulesByShow(UUID showId) {
        showRepository.findByIdAndStatus(showId, ShowStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException("Show not found"));
        return scheduleRepository.findByShow_IdAndStatusOrderByStartTimeAsc(showId, ScheduleStatus.ACTIVE)
                .stream()
                .map(CatalogMapper::toScheduleBrief)
                .toList();
    }

    @Transactional(readOnly = true)
    public BookingScheduleResponse getSchedule(UUID scheduleId) {
        ShowSchedule schedule = scheduleRepository.findById(scheduleId)
                .filter((candidate) -> candidate.getStatus() == ScheduleStatus.ACTIVE && candidate.getShow().getStatus() == ShowStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException("Schedule not found"));
        String id = schedule.getId().toString();
        return CatalogMapper.toBookingSchedule(
                schedule,
                ticketPricingService.unitPrice(schedule.getStandardPrice(), TicketType.STANDARD),
                ticketPricingService.unitPrice(schedule.getStandardPrice(), TicketType.VIP),
                ticketPricingService.unitPrice(schedule.getStandardPrice(), TicketType.FAMILY),
                ticketHoldService.effectiveAvailability(id, TicketType.STANDARD, schedule.getStandardAvailableTickets()),
                ticketHoldService.effectiveAvailability(id, TicketType.VIP, schedule.getVipAvailableTickets()),
                ticketHoldService.effectiveAvailability(id, TicketType.FAMILY, schedule.getFamilyAvailableTickets())
        );
    }

    private ShowListItemResponse toListItem(Show show) {
        ShowSchedule nextSchedule = scheduleRepository
                .findFirstByShow_IdAndStatusAndStartTimeAfterOrderByStartTimeAsc(show.getId(), ScheduleStatus.ACTIVE, LocalDateTime.now())
                .orElse(null);
        return new ShowListItemResponse(
                show.getId(),
                show.getTitle(),
                show.getImageUrl(),
                shortDescription(show.getDescription()),
                show.getDurationMinutes(),
                nextSchedule == null ? null : nextSchedule.getId(),
                nextSchedule == null ? null : nextSchedule.getStartTime(),
                nextSchedule == null ? null : CatalogMapper.venueName(nextSchedule)
        );
    }

    private String shortDescription(String description) {
        if (description == null || description.length() <= 140) {
            return description;
        }
        return description.substring(0, 137) + "...";
    }

    private String normalizeKeyword(String keyword) {
        return keyword == null || keyword.isBlank() ? null : keyword.trim();
    }

    private int sanitizeSize(int size) {
        if (size <= 0) {
            return 10;
        }
        return Math.min(size, 50);
    }
}
