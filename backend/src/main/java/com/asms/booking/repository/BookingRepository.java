package com.asms.booking.repository;

import com.asms.booking.entity.Booking;
import com.asms.booking.enums.BookingStatus;
import com.asms.identity.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Collection;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID>, JpaSpecificationExecutor<Booking> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") UUID id);

    @Query("""
            select b.id from Booking b
            where b.status = com.asms.booking.enums.BookingStatus.PENDING_PAYMENT
              and b.expiresAt <= :now
            order by b.expiresAt asc, b.id asc
            """)
    List<UUID> findExpirationCandidateIds(@Param("now") Instant now, Pageable pageable);

    Optional<Booking> findByIdAndUser(UUID id, User user);

    List<Booking> findByUserOrderByCreatedAtDesc(User user);

    List<Booking> findByUserAndStatusOrderByCreatedAtDesc(User user, BookingStatus status);

    Page<Booking> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    @Query(
            value = """
                    select distinct b from Booking b left join b.items i
                    where b.user = :user
                      and ((:pendingGroup = true and b.status in (com.asms.booking.enums.BookingStatus.PROCESSING, com.asms.booking.enums.BookingStatus.PENDING_PAYMENT))
                           or (:pendingGroup = false and (:status is null or b.status = :status)))
                      and (:keyword is null
                           or lower(b.bookingCode) like lower(concat('%', :keyword, '%'))
                           or lower(i.showName) like lower(concat('%', :keyword, '%'))
                           or lower(i.venueName) like lower(concat('%', :keyword, '%')))
                    order by b.createdAt desc
                    """,
            countQuery = """
                    select count(distinct b) from Booking b left join b.items i
                    where b.user = :user
                      and ((:pendingGroup = true and b.status in (com.asms.booking.enums.BookingStatus.PROCESSING, com.asms.booking.enums.BookingStatus.PENDING_PAYMENT))
                           or (:pendingGroup = false and (:status is null or b.status = :status)))
                      and (:keyword is null
                           or lower(b.bookingCode) like lower(concat('%', :keyword, '%'))
                           or lower(i.showName) like lower(concat('%', :keyword, '%'))
                           or lower(i.venueName) like lower(concat('%', :keyword, '%')))
                    """
    )
    Page<Booking> searchMyBookings(
            @Param("user") User user,
            @Param("keyword") String keyword,
            @Param("status") BookingStatus status,
            @Param("pendingGroup") boolean pendingGroup,
            Pageable pageable
    );

    long countByUser(User user);

    long countByUserAndStatus(User user, BookingStatus status);

    long countByUserAndStatusIn(User user, Collection<BookingStatus> statuses);

    boolean existsByBookingCode(String bookingCode);

    Optional<Booking> findByIdempotencyKey(String idempotencyKey);

    Optional<Booking> findByUserAndIdempotencyKey(User user, String idempotencyKey);

    @Query("select distinct b from Booking b join b.items i where i.holdId = :holdId")
    Optional<Booking> findByHoldId(@Param("holdId") String holdId);

    @Query("select count(distinct b) from Booking b join b.items i where i.scheduleId = :scheduleId and b.status = :status")
    long countByScheduleIdAndStatus(@Param("scheduleId") String scheduleId, @Param("status") BookingStatus status);

    @Query("""
            select coalesce(sum(i.quantity), 0) from Booking b join b.items i
            where i.scheduleId = :scheduleId and b.status = com.asms.booking.enums.BookingStatus.PAID
            """)
    long countPaidTicketsByScheduleId(@Param("scheduleId") String scheduleId);

    @Query("""
            select coalesce(sum(i.quantity), 0) from Booking b join b.items i
            where i.scheduleId = :scheduleId
              and b.status = com.asms.booking.enums.BookingStatus.PENDING_PAYMENT
              and b.expiresAt > :now
            """)
    long countNonExpiredPendingTicketsByScheduleId(@Param("scheduleId") String scheduleId, @Param("now") Instant now);

    @Query("""
            select distinct b from Booking b join b.items i
            where (:showId is null or i.showId = :showId)
              and (:scheduleId is null or i.scheduleId = :scheduleId)
              and (:status is null or b.status = :status)
              and (cast(:fromTime as Instant) is null or b.createdAt >= :fromTime)
              and (cast(:toTime as Instant) is null or b.createdAt <= :toTime)
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
