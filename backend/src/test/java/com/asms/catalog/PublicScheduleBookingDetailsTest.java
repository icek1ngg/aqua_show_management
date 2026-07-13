package com.asms.catalog;

import com.asms.booking.enums.TicketType;
import com.asms.booking.service.RedisTicketHoldService;
import com.asms.booking.service.TicketPricingService;
import com.asms.catalog.controller.PublicScheduleController;
import com.asms.catalog.dto.CatalogDtos.BookingScheduleResponse;
import com.asms.catalog.entity.Show;
import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.entity.Venue;
import com.asms.catalog.enums.ScheduleStatus;
import com.asms.catalog.enums.ShowStatus;
import com.asms.catalog.repository.ShowRepository;
import com.asms.catalog.repository.ShowScheduleRepository;
import com.asms.catalog.service.PublicShowService;
import com.asms.core.exception.NotFoundException;
import com.asms.core.response.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PublicScheduleBookingDetailsTest {

    @Mock
    private ShowRepository showRepository;

    @Mock
    private ShowScheduleRepository scheduleRepository;

    @Mock
    private RedisTicketHoldService holds;

    private PublicShowService publicShowService;
    private TicketPricingService pricing;

    @BeforeEach
    void setUp() {
        pricing = new TicketPricingService();
        publicShowService = new PublicShowService(showRepository, scheduleRepository, holds, pricing);
    }

    @Test
    void scheduleDetailsExposeAuthoritativeSnapshotsDerivedPricesAndRedisAdjustedAvailability() {
        Show show = new Show("Aqua Journey", "An ocean adventure", "/images/aqua.jpg", 45);
        Venue venue = new Venue("Main Plaza Pool", "Zone A", 200);
        LocalDateTime start = LocalDateTime.of(2026, 8, 1, 19, 0);
        LocalDateTime end = start.plusMinutes(45);
        ShowSchedule schedule = new ShowSchedule(
                show, venue, start, end, 100, 20, 10, new BigDecimal("2500")
        );
        when(scheduleRepository.findById(schedule.getId())).thenReturn(Optional.of(schedule));
        when(holds.effectiveAvailability(schedule.getId().toString(), TicketType.STANDARD, 100)).thenReturn(98);
        when(holds.effectiveAvailability(schedule.getId().toString(), TicketType.VIP, 20)).thenReturn(17);
        when(holds.effectiveAvailability(schedule.getId().toString(), TicketType.FAMILY, 10)).thenReturn(9);

        BookingScheduleResponse response = publicShowService.getSchedule(schedule.getId());

        assertThat(response.scheduleId()).isEqualTo(schedule.getId());
        assertThat(response.showId()).isEqualTo(show.getId());
        assertThat(response.showTitle()).isEqualTo("Aqua Journey");
        assertThat(response.showDescription()).isEqualTo("An ocean adventure");
        assertThat(response.showImageUrl()).isEqualTo("/images/aqua.jpg");
        assertThat(response.status()).isEqualTo(ScheduleStatus.ACTIVE);
        assertThat(response.startTime()).isEqualTo(start);
        assertThat(response.endTime()).isEqualTo(end);
        assertThat(response.venueId()).isEqualTo(venue.getId());
        assertThat(response.venueName()).isEqualTo("Main Plaza Pool");
        assertThat(response.venueLocation()).isEqualTo("Zone A");
        assertThat(response.standardBasePrice()).isEqualByComparingTo("2500");
        assertThat(response.standardPrice()).isEqualByComparingTo("2500.00");
        assertThat(response.vipPrice()).isEqualByComparingTo("6250.00");
        assertThat(response.familyPrice()).isEqualByComparingTo("3750.00");
        assertThat(response.standardCapacity()).isEqualTo(100);
        assertThat(response.vipCapacity()).isEqualTo(20);
        assertThat(response.familyCapacity()).isEqualTo(10);
        assertThat(response.standardAvailableTickets()).isEqualTo(98);
        assertThat(response.vipAvailableTickets()).isEqualTo(17);
        assertThat(response.familyAvailableTickets()).isEqualTo(9);
        verify(holds).effectiveAvailability(schedule.getId().toString(), TicketType.STANDARD, 100);
        verify(holds).effectiveAvailability(schedule.getId().toString(), TicketType.VIP, 20);
        verify(holds).effectiveAvailability(schedule.getId().toString(), TicketType.FAMILY, 10);
    }

    @Test
    void controllerReturnsBookingScheduleResponse() {
        UUID scheduleId = UUID.randomUUID();
        BookingScheduleResponse response = org.mockito.Mockito.mock(BookingScheduleResponse.class);
        PublicShowService service = org.mockito.Mockito.mock(PublicShowService.class);
        when(service.getSchedule(scheduleId)).thenReturn(response);

        ApiResponse<BookingScheduleResponse> result = new PublicScheduleController(service).getSchedule(scheduleId);

        assertThat(result.data()).isSameAs(response);
    }

    @Test
    void missingOrInactiveScheduleAndInactiveShowAreNotPubliclyVisible() {
        UUID missingId = UUID.randomUUID();
        when(scheduleRepository.findById(missingId)).thenReturn(Optional.empty());

        NotFoundException missing = catchThrowableOfType(
                () -> publicShowService.getSchedule(missingId),
                NotFoundException.class
        );
        assertThat(missing).hasMessage("Schedule not found");
        assertThat(missing.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);

        Show activeShow = new Show("Active", "Description", null, 30);
        Venue venue = new Venue("Pool", "Zone", 100);
        ShowSchedule inactiveSchedule = new ShowSchedule(
                activeShow, venue, LocalDateTime.now(), LocalDateTime.now().plusHours(1),
                10, 2, 1, BigDecimal.TEN
        );
        inactiveSchedule.setStatus(ScheduleStatus.INACTIVE);
        when(scheduleRepository.findById(inactiveSchedule.getId())).thenReturn(Optional.of(inactiveSchedule));

        assertThatThrownBy(() -> publicShowService.getSchedule(inactiveSchedule.getId()))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Schedule not found");

        Show inactiveShow = new Show("Inactive", "Description", null, 30);
        inactiveShow.setStatus(ShowStatus.INACTIVE);
        ShowSchedule hiddenSchedule = new ShowSchedule(
                inactiveShow, venue, LocalDateTime.now(), LocalDateTime.now().plusHours(1),
                10, 2, 1, BigDecimal.TEN
        );
        when(scheduleRepository.findById(hiddenSchedule.getId())).thenReturn(Optional.of(hiddenSchedule));

        assertThatThrownBy(() -> publicShowService.getSchedule(hiddenSchedule.getId()))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Schedule not found");
    }

    @Test
    void scheduleSnapshotIsMappedInsideReadOnlyTransaction() throws Exception {
        Transactional transactional = PublicShowService.class
                .getMethod("getSchedule", UUID.class)
                .getAnnotation(Transactional.class);

        assertThat(transactional).isNotNull();
        assertThat(transactional.readOnly()).isTrue();
    }
}
