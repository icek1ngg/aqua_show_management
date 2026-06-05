package com.asms.booking.repository;

import com.asms.booking.entity.Booking;
import com.asms.booking.enums.BookingStatus;
import com.asms.identity.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    Optional<Booking> findByIdAndUser(UUID id, User user);

    List<Booking> findByUserOrderByCreatedAtDesc(User user);

    List<Booking> findByUserAndStatusOrderByCreatedAtDesc(User user, BookingStatus status);

    Page<Booking> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    boolean existsByBookingCode(String bookingCode);

    Optional<Booking> findByHoldId(String holdId);

    long countByScheduleIdAndStatus(String scheduleId, BookingStatus status);

    @Query("""
            select coalesce(sum(b.quantity), 0) from Booking b
            where b.scheduleId = :scheduleId and b.status = com.asms.booking.enums.BookingStatus.PAID
            """)
    long countPaidTicketsByScheduleId(@Param("scheduleId") String scheduleId);

    @Query("""
            select b from Booking b
            where (:showId is null or b.showId = :showId)
              and (:scheduleId is null or b.scheduleId = :scheduleId)
              and (:status is null or b.status = :status)
              and (:fromTime is null or b.createdAt >= :fromTime)
              and (:toTime is null or b.createdAt <= :toTime)
            order by b.createdAt desc
            """)
    Page<Booking> searchForManager(
            @Param("showId") String showId,
            @Param("scheduleId") String scheduleId,
            @Param("status") BookingStatus status,
            @Param("fromTime") Instant fromTime,
            @Param("toTime") Instant toTime,
            Pageable pageable
    );
}
