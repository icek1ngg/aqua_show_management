package com.asms.ticketing.repository;

import com.asms.ticketing.entity.Ticket;
import com.asms.ticketing.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import com.asms.identity.entity.User;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID>, JpaSpecificationExecutor<Ticket> {

    boolean existsByBooking_Id(UUID bookingId);

    List<Ticket> findByBooking_Id(UUID bookingId);

    @Override
    @EntityGraph(attributePaths = {"booking", "bookingItem"})
    Page<Ticket> findAll(Specification<Ticket> specification, Pageable pageable);

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
