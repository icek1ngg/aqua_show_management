package com.asms.catalog.repository;

import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.enums.ScheduleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;

public interface ShowScheduleRepository extends JpaRepository<ShowSchedule, UUID>, JpaSpecificationExecutor<ShowSchedule> {

    List<ShowSchedule> findByShow_IdAndStatusOrderByStartTimeAsc(UUID showId, ScheduleStatus status);

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

    @Query("""
            select coalesce(sum(b.quantity), 0) from Booking b
            where b.scheduleId = :scheduleId
              and b.ticketType = :ticketType
              and b.status = com.asms.booking.enums.BookingStatus.PAID
            """)
    long countPaidTicketsByScheduleIdAndTicketType(
            @Param("scheduleId") String scheduleId,
            @Param("ticketType") String ticketType
    );

    Page<ShowSchedule> findAll(org.springframework.data.jpa.domain.Specification<ShowSchedule> specification, Pageable pageable);
}
