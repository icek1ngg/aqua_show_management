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
import com.asms.catalog.service.ScheduleSchemaInitializer;
import com.asms.catalog.service.ScheduleSchemaMigration;
import com.asms.catalog.service.ScheduleService;
import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.ConflictException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import jakarta.persistence.EntityManagerFactory;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assumptions.assumeTrue;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
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
    void compatibilityMigrationBackfillsAndConstrainsPerTypeColumns() throws Exception {
        String schema = Files.readString(Path.of("src/main/resources/schema.sql"));

        assertThat(schema).contains(
                "ADD COLUMN IF NOT EXISTS standard_capacity integer",
                "standard_capacity = capacity - paid_vip - paid_family",
                "standard_available_tickets = available_tickets",
                "standard_price = COALESCE(standard_price, price)",
                "ALTER COLUMN standard_capacity SET NOT NULL",
                "ALTER COLUMN vip_capacity SET NOT NULL",
                "ALTER COLUMN family_capacity SET NOT NULL",
                "ALTER COLUMN standard_available_tickets SET NOT NULL",
                "ALTER COLUMN vip_available_tickets SET NOT NULL",
                "ALTER COLUMN family_available_tickets SET NOT NULL",
                "ALTER COLUMN standard_price SET NOT NULL"
        );
    }

    @Test
    void migrationReconcilesPaidTypesAndSerializesBookingMutations() throws Exception {
        String schema = Files.readString(Path.of("src/main/resources/schema.sql"));

        assertThat(schema).contains(
                "status = 'PAID'",
                "paid_standard",
                "paid_vip",
                "paid_family",
                "capacity migration cannot preserve legacy totals",
                "FOR UPDATE",
                "GET DIAGNOSTICS changed_rows = ROW_COUNT",
                "CREATE TRIGGER",
                "BEFORE INSERT OR UPDATE OF status, quantity, ticket_type, schedule_id OR DELETE"
        );
        assertThat(schema).doesNotContain("vip_capacity = COALESCE(vip_capacity, 0)");
    }

    @Test
    void migrationRejectsMissingSchedulesMalformedTypesAndNonPositiveQuantities() throws Exception {
        String schema = Files.readString(Path.of("src/main/resources/schema.sql"));

        assertThat(schema).contains(
                "paid_unknown_count",
                "COUNT(*) FILTER",
                "COALESCE(UPPER(TRIM(ticket_type)), '') NOT LIKE",
                "paid_nonpositive_count",
                "quantity <= 0",
                "bookings_quantity_positive",
                "CHECK (quantity > 0)",
                "matched_schedule_count <> 1",
                "Paid booking schedule not found"
        );
    }

    @Test
    void migrationRunsBeforeHibernateValidationAndRepeatsAfterSchemaCreation() throws Exception {
        String application = Files.readString(Path.of("src/main/resources/application.yml"));
        String initializer = Files.readString(Path.of(
                "src/main/java/com/asms/catalog/service/ScheduleSchemaInitializer.java"
        ));

        assertThat(application).contains(
                "defer-datasource-initialization: false",
                "separator: ^^^"
        );
        assertThat(initializer).contains(
                "InitializingBean",
                "afterPropertiesSet()",
                "migration.isRequired()",
                "migration.migrate()"
        );
    }

    @Test
    void oldSchemaStartupSkipsPostHibernateMigrationAfterPreJpaMarker() {
        ScheduleSchemaMigration migration = mock(ScheduleSchemaMigration.class);
        when(migration.isRequired()).thenReturn(false);
        ScheduleSchemaInitializer initializer = new ScheduleSchemaInitializer(
                migration,
                mock(EntityManagerFactory.class)
        );

        initializer.afterPropertiesSet();

        verify(migration).isRequired();
        verify(migration, never()).migrate();
    }

    @Test
    void freshSchemaStartupRunsPostHibernateMigrationExactlyOnce() {
        ScheduleSchemaMigration migration = mock(ScheduleSchemaMigration.class);
        when(migration.isRequired()).thenReturn(true);
        ScheduleSchemaInitializer initializer = new ScheduleSchemaInitializer(
                migration,
                mock(EntityManagerFactory.class)
        );

        initializer.afterPropertiesSet();

        verify(migration).isRequired();
        verify(migration, times(1)).migrate();
    }

    @Test
    void migrationUsesSingleVersionMarkerAcrossPreAndPostJpaPasses() throws Exception {
        String schema = Files.readString(Path.of("src/main/resources/schema.sql"));
        String migration = Files.readString(Path.of(
                "src/main/java/com/asms/catalog/service/ScheduleSchemaMigration.java"
        ));

        assertThat(schema).contains(
                "CREATE TABLE IF NOT EXISTS asms_schema_migrations",
                "2026_07_14_schedule_capacity_v3",
                "INSERT INTO asms_schema_migrations"
        );
        assertThat(migration).contains(
                "2026_07_14_schedule_capacity_v3",
                "isRequired()",
                "migrate()"
        );
    }

    @Test
    void migrationSerializesMarkerCheckAndInstallInOneTransaction() throws Exception {
        String schema = Files.readString(Path.of("src/main/resources/schema.sql"));

        assertThat(schema).startsWith("BEGIN^^^");
        assertThat(schema).contains(
                "pg_advisory_xact_lock",
                "hashtextextended('2026_07_14_schedule_capacity_v3', 0)",
                "COMMIT^^^"
        );
        assertThat(schema.indexOf("pg_advisory_xact_lock"))
                .isLessThan(schema.indexOf("CREATE TABLE IF NOT EXISTS asms_schema_migrations"));
        assertThat(schema.lastIndexOf("COMMIT^^^"))
                .isGreaterThan(schema.lastIndexOf("INSERT INTO asms_schema_migrations"));
    }

    @Test
    void migrationRejectsPaidBookingsWithoutScheduleBeforeApplyingMarker() throws Exception {
        String schema = Files.readString(Path.of("src/main/resources/schema.sql"));

        assertThat(schema).contains(
                "paid_orphan_count",
                "NOT EXISTS",
                "Paid booking schedule not found during migration"
        );
        assertThat(schema.indexOf("Paid booking schedule not found during migration"))
                .isLessThan(schema.indexOf("INSERT INTO asms_schema_migrations"));
    }

    @Test
    void concurrentPostgresMigrationAppliesOnceWithoutDuplicateMarker() throws Exception {
        assumeTrue(Boolean.getBoolean("asms.postgres.integration"));
        String url = System.getProperty("asms.postgres.url", "jdbc:postgresql://localhost:5432/asms_db");
        String user = System.getProperty("asms.postgres.user", "asms_user");
        String password = System.getProperty("asms.postgres.password", "asms_password");
        String schemaName = "task2_concurrent_" + UUID.randomUUID().toString().replace("-", "");

        try (Connection setup = DriverManager.getConnection(url, user, password);
             Statement statement = setup.createStatement()) {
            statement.execute("CREATE SCHEMA " + schemaName);
            statement.execute("SET search_path TO " + schemaName);
            statement.execute("CREATE TABLE show_schedules (id uuid PRIMARY KEY, capacity integer NOT NULL, available_tickets integer NOT NULL, price numeric(12,2) NOT NULL)");
            statement.execute("CREATE TABLE bookings (id uuid PRIMARY KEY, schedule_id varchar(255), status varchar(30), ticket_type varchar(30), quantity integer)");
            statement.execute("INSERT INTO show_schedules VALUES ('00000000-0000-0000-0000-000000000501', 10, 9, 2500)");

            String migration = Files.readString(Path.of("src/main/resources/schema.sql"));
            CountDownLatch ready = new CountDownLatch(2);
            CountDownLatch start = new CountDownLatch(1);
            ExecutorService executor = Executors.newFixedThreadPool(2);
            try {
                Future<?> first = executor.submit(() -> executeMigration(url, user, password, schemaName, migration, ready, start));
                Future<?> second = executor.submit(() -> executeMigration(url, user, password, schemaName, migration, ready, start));
                assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
                start.countDown();
                first.get(30, TimeUnit.SECONDS);
                second.get(30, TimeUnit.SECONDS);
            } finally {
                executor.shutdownNow();
            }

            try (ResultSet result = statement.executeQuery(
                    "SELECT count(*) FROM asms_schema_migrations WHERE version = '2026_07_14_schedule_capacity_v3'"
            )) {
                result.next();
                assertThat(result.getInt(1)).isEqualTo(1);
            }
        } finally {
            try (Connection cleanup = DriverManager.getConnection(url, user, password);
                 Statement statement = cleanup.createStatement()) {
                statement.execute("DROP SCHEMA IF EXISTS " + schemaName + " CASCADE");
            }
        }
    }

    private static void executeMigration(
            String url,
            String user,
            String password,
            String schemaName,
            String migration,
            CountDownLatch ready,
            CountDownLatch start
    ) {
        try (Connection connection = DriverManager.getConnection(url, user, password);
             Statement statement = connection.createStatement()) {
            statement.execute("SET search_path TO " + schemaName);
            ready.countDown();
            start.await();
            for (String sql : migration.split("\\Q^^^\\E")) {
                if (!sql.isBlank()) {
                    statement.execute(sql);
                }
            }
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    private ShowSchedule schedule(int standard, int vip, int family) {
        return new ShowSchedule(show, venue, start, end, standard, vip, family, new BigDecimal("2500"));
    }
}
