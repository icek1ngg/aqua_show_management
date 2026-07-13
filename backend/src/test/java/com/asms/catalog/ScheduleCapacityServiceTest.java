package com.asms.catalog;

import com.asms.booking.enums.TicketType;
import com.asms.booking.repository.BookingRepository;
import com.asms.catalog.dto.CatalogDtos.CreateScheduleRequest;
import com.asms.catalog.dto.CatalogDtos.ScheduleManagementResponse;
import com.asms.catalog.dto.CatalogDtos.UpdateScheduleRequest;
import com.asms.catalog.entity.Show;
import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.entity.Venue;
import com.asms.catalog.enums.ShowStatus;
import com.asms.catalog.enums.VenueStatus;
import com.asms.catalog.repository.ShowRepository;
import com.asms.catalog.repository.ShowScheduleRepository;
import com.asms.catalog.repository.VenueRepository;
import com.asms.catalog.service.CatalogCacheService;
import com.asms.catalog.service.ScheduleService;
import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.ConflictException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import jakarta.persistence.Column;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ScheduleCapacityServiceTest {

    private final ShowScheduleRepository scheduleRepository = mock(ShowScheduleRepository.class);
    private final ShowRepository showRepository = mock(ShowRepository.class);
    private final VenueRepository venueRepository = mock(VenueRepository.class);
    private final BookingRepository bookingRepository = mock(BookingRepository.class);
    private final CatalogCacheService cacheService = mock(CatalogCacheService.class);

    private ScheduleService service;
    private Show show;
    private Venue venue;
    private LocalDateTime start;
    private LocalDateTime end;

    @BeforeEach
    void setUp() {
        service = new ScheduleService(
                scheduleRepository,
                showRepository,
                venueRepository,
                bookingRepository,
                cacheService
        );
        show = new Show("Aqua Show", "A show", null, 45);
        venue = new Venue("Main Pool", "Zone A", 100);
        start = LocalDateTime.now().plusDays(2);
        end = start.plusMinutes(45);

        when(showRepository.findByIdAndStatus(show.getId(), ShowStatus.ACTIVE)).thenReturn(Optional.of(show));
        when(venueRepository.findByIdAndStatus(venue.getId(), VenueStatus.ACTIVE)).thenReturn(Optional.of(venue));
        when(scheduleRepository.save(any(ShowSchedule.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createScheduleStoresPerTypeCapacityAndStandardPrice() {
        CreateScheduleRequest request = new CreateScheduleRequest(
                show.getId(), venue.getId(), start, end, 70, 20, 10, new BigDecimal("2500")
        );

        ScheduleManagementResponse result = service.createSchedule(request);

        assertThat(result.standardCapacity()).isEqualTo(70);
        assertThat(result.vipCapacity()).isEqualTo(20);
        assertThat(result.familyCapacity()).isEqualTo(10);
        assertThat(result.totalCapacity()).isEqualTo(100);
        assertThat(result.standardPrice()).isEqualByComparingTo("2500");
    }

    @Test
    void rejectsCapacityTotalAboveVenueCapacity() {
        CreateScheduleRequest request = new CreateScheduleRequest(
                show.getId(), venue.getId(), start, end, 80, 20, 1, new BigDecimal("2500")
        );

        assertThatThrownBy(() -> service.createSchedule(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Ticket capacity total cannot exceed venue capacity");
    }

    @Test
    void tracksAndDecrementsAvailabilityByTicketType() {
        ShowSchedule schedule = schedule(70, 20, 10);

        schedule.decrementAvailable(TicketType.VIP, 3);

        assertThat(schedule.availableFor(TicketType.STANDARD)).isEqualTo(70);
        assertThat(schedule.availableFor(TicketType.VIP)).isEqualTo(17);
        assertThat(schedule.availableFor(TicketType.FAMILY)).isEqualTo(10);
        assertThat(schedule.getTotalAvailableTickets()).isEqualTo(97);
    }

    @Test
    void rejectsDecrementBeyondTicketTypeAvailability() {
        ShowSchedule schedule = schedule(70, 20, 10);

        assertThatThrownBy(() -> schedule.decrementAvailable(TicketType.FAMILY, 11))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Not enough tickets available");
    }

    @Test
    void rejectsNonPositiveDecrementQuantity() {
        ShowSchedule schedule = schedule(70, 20, 10);

        assertThatThrownBy(() -> schedule.decrementAvailable(TicketType.STANDARD, 0))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Quantity must be greater than 0");
        assertThatThrownBy(() -> schedule.decrementAvailable(TicketType.STANDARD, Integer.MIN_VALUE))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Quantity must be greater than 0");
    }

    @Test
    void updateSchedulePreservesSoldQuantityForEachTicketType() {
        ShowSchedule schedule = schedule(70, 20, 10);
        schedule.decrementAvailable(TicketType.STANDARD, 5);
        schedule.decrementAvailable(TicketType.VIP, 2);
        schedule.decrementAvailable(TicketType.FAMILY, 1);
        when(scheduleRepository.findByIdForUpdate(schedule.getId())).thenReturn(Optional.of(schedule));
        when(scheduleRepository.countPaidTicketsByScheduleIdAndTicketType(schedule.getId().toString(), "STANDARD")).thenReturn(5L);
        when(scheduleRepository.countPaidTicketsByScheduleIdAndTicketType(schedule.getId().toString(), "VIP")).thenReturn(2L);
        when(scheduleRepository.countPaidTicketsByScheduleIdAndTicketType(schedule.getId().toString(), "FAMILY")).thenReturn(1L);
        UpdateScheduleRequest request = new UpdateScheduleRequest(null, null, null, 65, 25, 10, null, null);

        ScheduleManagementResponse result = service.updateSchedule(schedule.getId(), request);

        assertThat(result.standardAvailableTickets()).isEqualTo(60);
        assertThat(result.vipAvailableTickets()).isEqualTo(23);
        assertThat(result.familyAvailableTickets()).isEqualTo(9);
        assertThat(result.totalAvailableTickets()).isEqualTo(92);
    }

    @Test
    void updateScheduleLocksRowAndPreservesPaidQuantityNotYetReflectedInAvailability() {
        ShowSchedule schedule = schedule(70, 20, 10);
        when(scheduleRepository.findByIdForUpdate(schedule.getId())).thenReturn(Optional.of(schedule));
        when(scheduleRepository.countPaidTicketsByScheduleIdAndTicketType(schedule.getId().toString(), "VIP"))
                .thenReturn(4L);
        UpdateScheduleRequest request = new UpdateScheduleRequest(null, null, null, 70, 20, 10, null, null);

        ScheduleManagementResponse result = service.updateSchedule(schedule.getId(), request);

        assertThat(result.vipAvailableTickets()).isEqualTo(16);
        verify(scheduleRepository).findByIdForUpdate(schedule.getId());
    }

    @Test
    void rejectsUpdatedTypeCapacityBelowAlreadySoldQuantity() {
        ShowSchedule schedule = schedule(70, 20, 10);
        schedule.decrementAvailable(TicketType.VIP, 4);
        when(scheduleRepository.findByIdForUpdate(schedule.getId())).thenReturn(Optional.of(schedule));
        UpdateScheduleRequest request = new UpdateScheduleRequest(null, null, null, null, 3, null, null, null);

        assertThatThrownBy(() -> service.updateSchedule(schedule.getId(), request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("VIP capacity cannot be lower than sold ticket quantity");
    }

    @Test
    void rejectsZeroTotalCapacity() {
        CreateScheduleRequest request = new CreateScheduleRequest(
                show.getId(), venue.getId(), start, end, 0, 0, 0, new BigDecimal("2500")
        );

        assertThatThrownBy(() -> service.createSchedule(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Ticket capacity total must be greater than 0");
    }

    @Test
    void rejectsNegativeTypeCapacity() {
        CreateScheduleRequest request = new CreateScheduleRequest(
                show.getId(), venue.getId(), start, end, 70, -1, 10, new BigDecimal("2500")
        );

        assertThatThrownBy(() -> service.createSchedule(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Ticket capacities must not be negative");
    }

    @Test
    void hibernateCreatesRequiredTicketCapacityAndPriceColumns() throws Exception {
        for (String fieldName : new String[]{
                "standardCapacity", "vipCapacity", "familyCapacity",
                "standardAvailableTickets", "vipAvailableTickets", "familyAvailableTickets",
                "standardPrice"
        }) {
            Column column = ShowSchedule.class.getDeclaredField(fieldName).getAnnotation(Column.class);
            assertThat(column.nullable()).as(fieldName).isFalse();
        }
    }

    private ShowSchedule schedule(int standard, int vip, int family) {
        return new ShowSchedule(show, venue, start, end, standard, vip, family, new BigDecimal("2500"));
    }
}
