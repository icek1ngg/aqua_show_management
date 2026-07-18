package com.asms.catalog;

import com.asms.booking.enums.TicketType;
import com.asms.booking.service.RedisTicketHoldService;
import com.asms.booking.service.TicketPricingService;
import com.asms.catalog.dto.CatalogDtos.BookingScheduleResponse;
import com.asms.catalog.dto.CatalogDtos.UpcomingScheduleResponse;
import com.asms.catalog.entity.Show;
import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.entity.Venue;
import com.asms.catalog.repository.ShowScheduleRepository;
import com.asms.catalog.service.PublicShowService;
import org.hibernate.Hibernate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.transaction.TestTransaction;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@Import({PublicShowService.class, TicketPricingService.class})
class PublicScheduleJpaTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private PublicShowService publicShowService;

    @Autowired
    private ShowScheduleRepository scheduleRepository;

    @MockBean
    private RedisTicketHoldService holds;

    @Test
    void serviceTransactionMapsPersistedLazyShowAndVenueRelations() {
        Show show = new Show("Aqua Journey", "An ocean adventure", "/images/aqua.jpg", 45);
        Venue venue = new Venue("Main Plaza Pool", "Zone A", 200);
        LocalDateTime start = LocalDateTime.of(2026, 8, 1, 19, 0);
        ShowSchedule schedule = new ShowSchedule(
                show,
                venue,
                start,
                start.plusMinutes(45),
                100,
                20,
                10,
                new BigDecimal("2500")
        );
        entityManager.persist(show);
        entityManager.persist(venue);
        entityManager.persist(schedule);
        entityManager.flush();
        UUID scheduleId = schedule.getId();

        entityManager.clear();
        ShowSchedule reloaded = entityManager.find(ShowSchedule.class, scheduleId);
        assertThat(Hibernate.isInitialized(reloaded.getShow())).isFalse();
        assertThat(Hibernate.isInitialized(reloaded.getVenue())).isFalse();

        TestTransaction.flagForCommit();
        TestTransaction.end();
        assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();

        when(holds.effectiveAvailability(anyString(), eq(TicketType.STANDARD), anyInt()))
                .thenAnswer(invocation -> availabilityInsideTransaction(invocation.getArgument(2)));
        when(holds.effectiveAvailability(anyString(), eq(TicketType.VIP), anyInt()))
                .thenAnswer(invocation -> availabilityInsideTransaction(invocation.getArgument(2)));
        when(holds.effectiveAvailability(anyString(), eq(TicketType.FAMILY), anyInt()))
                .thenAnswer(invocation -> availabilityInsideTransaction(invocation.getArgument(2)));

        BookingScheduleResponse response = publicShowService.getSchedule(scheduleId);

        assertThat(response.showTitle()).isEqualTo("Aqua Journey");
        assertThat(response.venueName()).isEqualTo("Main Plaza Pool");
        assertThat(response.standardPrice()).isEqualByComparingTo("2500.00");
        assertThat(response.vipPrice()).isEqualByComparingTo("6250.00");
        assertThat(response.familyPrice()).isEqualByComparingTo("3750.00");
        assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
    }

    @Test
    void checkoutRepositoryLookupReturnsDetachedScheduleWithInitializedSnapshotRelations() {
        Show show = new Show("Checkout Snapshot", "Detached checkout test", "/images/checkout.jpg", 45);
        Venue venue = new Venue("Checkout Pool", "Zone B", 200);
        LocalDateTime start = LocalDateTime.of(2026, 8, 2, 19, 0);
        ShowSchedule schedule = new ShowSchedule(
                show,
                venue,
                start,
                start.plusMinutes(45),
                100,
                20,
                10,
                new BigDecimal("2500")
        );
        entityManager.persist(show);
        entityManager.persist(venue);
        entityManager.persist(schedule);
        entityManager.flush();
        UUID scheduleId = schedule.getId();

        TestTransaction.flagForCommit();
        TestTransaction.end();
        assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();

        ShowSchedule detached = scheduleRepository.findById(scheduleId).orElseThrow();

        assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
        assertThat(Hibernate.isInitialized(detached.getShow())).isTrue();
        assertThat(Hibernate.isInitialized(detached.getVenue())).isTrue();
        assertThat(detached.getShow().getTitle()).isEqualTo("Checkout Snapshot");
        assertThat(detached.getVenue().getName()).isEqualTo("Checkout Pool");
    }

    @Test
    void upcomingScheduleFeedKeepsMultipleSchedulesForOneShowInTimeOrder() {
        Show show = new Show("Recurring Aqua Show", "A show with multiple dates", "/images/recurring.jpg", 45);
        Venue venue = new Venue("Recurring Pool", "Zone C", 200);
        LocalDateTime now = LocalDateTime.now();
        ShowSchedule later = new ShowSchedule(show, venue, now.plusDays(3), now.plusDays(3).plusMinutes(45), 100, 20, 10, new BigDecimal("2500"));
        ShowSchedule nearest = new ShowSchedule(show, venue, now.plusDays(1), now.plusDays(1).plusMinutes(45), 100, 20, 10, new BigDecimal("2500"));
        ShowSchedule past = new ShowSchedule(show, venue, now.minusDays(1), now.minusDays(1).plusMinutes(45), 100, 20, 10, new BigDecimal("2500"));
        entityManager.persist(show);
        entityManager.persist(venue);
        entityManager.persist(later);
        entityManager.persist(nearest);
        entityManager.persist(past);
        entityManager.flush();

        List<UpcomingScheduleResponse> response = publicShowService.getUpcomingSchedules();

        assertThat(response).extracting(UpcomingScheduleResponse::scheduleId)
                .containsExactly(nearest.getId(), later.getId());
        assertThat(response).extracting(UpcomingScheduleResponse::showId)
                .containsExactly(show.getId(), show.getId());
    }

    private int availabilityInsideTransaction(int persistentAvailable) {
        assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isTrue();
        assertThat(TransactionSynchronizationManager.isCurrentTransactionReadOnly()).isTrue();
        return persistentAvailable;
    }
}
