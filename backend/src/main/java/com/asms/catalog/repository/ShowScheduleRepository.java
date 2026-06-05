package com.asms.catalog.repository;

import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.enums.ScheduleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShowScheduleRepository extends JpaRepository<ShowSchedule, UUID> {

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

    @Query("""
            select s from ShowSchedule s
            where (:showId is null or s.show.id = :showId)
              and (:venueId is null or s.venue.id = :venueId)
              and (:status is null or s.status = :status)
              and (:fromTime is null or s.startTime >= :fromTime)
              and (:toTime is null or s.startTime <= :toTime)
            order by s.startTime desc
            """)
    Page<ShowSchedule> search(
            @Param("showId") UUID showId,
            @Param("venueId") UUID venueId,
            @Param("status") ScheduleStatus status,
            @Param("fromTime") LocalDateTime fromTime,
            @Param("toTime") LocalDateTime toTime,
            Pageable pageable
    );
}
