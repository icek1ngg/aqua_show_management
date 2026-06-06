package com.asms.ticketing.repository;

import com.asms.ticketing.entity.CheckInLog;
import com.asms.ticketing.enums.CheckInResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface CheckInLogRepository extends JpaRepository<CheckInLog, UUID> {

    Optional<CheckInLog> findFirstByTicket_IdAndStaff_IdAndResultAndCheckInTimeAfterOrderByCheckInTimeDesc(
            UUID ticketId,
            UUID staffId,
            CheckInResult result,
            Instant checkedAfter
    );
}
