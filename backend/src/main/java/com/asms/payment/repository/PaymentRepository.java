package com.asms.payment.repository;

import com.asms.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByBooking_Id(UUID bookingId);

    Optional<Payment> findByPayosOrderCode(String payosOrderCode);
}
