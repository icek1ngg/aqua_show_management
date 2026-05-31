package com.asms.booking.repository;

import com.asms.booking.entity.Booking;
import com.asms.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    Optional<Booking> findByIdAndUser(UUID id, User user);

    List<Booking> findByUserOrderByCreatedAtDesc(User user);

    boolean existsByBookingCode(String bookingCode);

    Optional<Booking> findByHoldId(String holdId);
}
