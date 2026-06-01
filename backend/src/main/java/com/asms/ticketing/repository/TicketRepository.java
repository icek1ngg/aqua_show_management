package com.asms.ticketing.repository;

import com.asms.ticketing.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    boolean existsByBooking_Id(UUID bookingId);

    List<Ticket> findByBooking_Id(UUID bookingId);

    Optional<Ticket> findByQrCode(String qrCode);
}
