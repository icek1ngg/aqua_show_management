package com.asms.booking.repository;

import com.asms.booking.entity.BookingItem;
import com.asms.booking.enums.TicketType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.UUID;

public interface BookingItemRepository extends JpaRepository<BookingItem, UUID> {

    @Query("""
            select coalesce(sum(i.quantity), 0) from BookingItem i
            where i.scheduleId = :scheduleId
              and i.booking.status = com.asms.booking.enums.BookingStatus.PAID
            """)
    long countPaidTicketsByScheduleId(@Param("scheduleId") String scheduleId);

    @Query("""
            select coalesce(sum(i.quantity), 0) from BookingItem i
            where i.scheduleId = :scheduleId
              and i.ticketType = :ticketType
              and i.booking.status = com.asms.booking.enums.BookingStatus.PAID
            """)
    long countPaidTicketsByScheduleIdAndTicketType(
            @Param("scheduleId") String scheduleId,
            @Param("ticketType") TicketType ticketType
    );

    @Query("""
            select coalesce(sum(i.quantity), 0) from BookingItem i
            where i.scheduleId = :scheduleId
              and i.booking.status = com.asms.booking.enums.BookingStatus.PENDING_PAYMENT
              and i.booking.expiresAt > :now
            """)
    long countNonExpiredPendingTicketsByScheduleId(
            @Param("scheduleId") String scheduleId,
            @Param("now") Instant now
    );
}
