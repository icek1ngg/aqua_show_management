package com.asms.ticketing.repository;

import com.asms.ticketing.entity.Ticket;
import com.asms.ticketing.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    boolean existsByBooking_Id(UUID bookingId);

    List<Ticket> findByBooking_Id(UUID bookingId);

    Optional<Ticket> findByQrCode(String qrCode);

    @Query("select t from Ticket t join fetch t.booking where t.qrCode = :qrCode")
    Optional<Ticket> findByQrCodeWithBooking(@Param("qrCode") String qrCode);

    @Modifying
    @Query("""
            update Ticket t
            set t.status = :usedStatus, t.usedAt = :usedAt
            where t.id = :ticketId and t.status = :validStatus
            """)
    int markUsedIfValid(
            @Param("ticketId") UUID ticketId,
            @Param("validStatus") TicketStatus validStatus,
            @Param("usedStatus") TicketStatus usedStatus,
            @Param("usedAt") Instant usedAt
    );
}
