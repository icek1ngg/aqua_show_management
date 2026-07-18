package com.asms.catalog.repository;

import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.enums.ScheduleStatus;
import com.asms.catalog.enums.ShowStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;

public interface ShowScheduleRepository extends JpaRepository<ShowSchedule, UUID>, JpaSpecificationExecutor<ShowSchedule> {

    @Override
    @EntityGraph(attributePaths = {"show", "venue"})
    Optional<ShowSchedule> findById(UUID id);

    List<ShowSchedule> findByShow_IdAndStatusOrderByStartTimeAsc(UUID showId, ScheduleStatus status);

    @EntityGraph(attributePaths = {"show", "venue"})
    @Query("""
            select schedule from ShowSchedule schedule
            where schedule.status = :scheduleStatus
              and schedule.show.status = :showStatus
              and schedule.startTime > :after
            order by schedule.startTime asc, schedule.id asc
            """)
    List<ShowSchedule> findUpcomingActiveSchedules(
            @Param("scheduleStatus") ScheduleStatus scheduleStatus,
            @Param("showStatus") ShowStatus showStatus,
            @Param("after") LocalDateTime after
    );

    Optional<ShowSchedule> findFirstByShow_IdAndStatusAndStartTimeAfterOrderByStartTimeAsc(
            UUID showId,
            ScheduleStatus status,
            LocalDateTime startTime
    );

    @Query("""
            select count(s) > 0 from ShowSchedule s
            where s.venue.id = :venueId
              and s.status = com.asms.catalog.enums.ScheduleStatus.ACTIVE
              and (:excludeId is null or s.id <> :excludeId)
              and s.startTime < :endTime
              and s.endTime > :startTime
            """)
    boolean existsVenueConflict(
            @Param("venueId") UUID venueId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("excludeId") UUID excludeId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from ShowSchedule s where s.id = :id")
    Optional<ShowSchedule> findByIdForUpdate(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from ShowSchedule s where s.id in :ids order by s.id")
    List<ShowSchedule> findAllByIdForUpdate(@Param("ids") Collection<UUID> ids);

    @Query("""
            select coalesce(sum(i.quantity), 0) from BookingItem i
            where i.scheduleId = :scheduleId
              and str(i.ticketType) = :ticketType
              and i.booking.status = com.asms.booking.enums.BookingStatus.PAID
            """)
    long countPaidTicketsByScheduleIdAndTicketType(
            @Param("scheduleId") String scheduleId,
            @Param("ticketType") String ticketType
    );

    Page<ShowSchedule> findAll(org.springframework.data.jpa.domain.Specification<ShowSchedule> specification, Pageable pageable);
}
