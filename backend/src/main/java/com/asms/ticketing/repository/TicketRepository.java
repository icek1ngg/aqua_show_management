package com.asms.ticketing.repository;

import com.asms.ticketing.entity.Ticket;
import com.asms.ticketing.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.asms.identity.entity.User;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    boolean existsByBooking_Id(UUID bookingId);

    List<Ticket> findByBooking_Id(UUID bookingId);

    @Query(
            value = """
                    select t from Ticket t
                    join fetch t.booking b
                    left join fetch t.bookingItem i
                    where b.user = :user
                      and (:bookingId is null or b.id = :bookingId)
                      and (:status is null or t.status = :status)
                      and (:keyword is null
                           or lower(b.bookingCode) like lower(concat('%', :keyword, '%'))
                           or lower(t.showName) like lower(concat('%', :keyword, '%')))
                    order by t.showStartTime desc, t.issuedAt desc
                    """,
            countQuery = """
                    select count(t) from Ticket t join t.booking b
                    where b.user = :user
                      and (:bookingId is null or b.id = :bookingId)
                      and (:status is null or t.status = :status)
                      and (:keyword is null
                           or lower(b.bookingCode) like lower(concat('%', :keyword, '%'))
                           or lower(t.showName) like lower(concat('%', :keyword, '%')))
                    """
    )
    Page<Ticket> searchMyTickets(
            @Param("user") User user,
            @Param("bookingId") UUID bookingId,
            @Param("status") TicketStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

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
