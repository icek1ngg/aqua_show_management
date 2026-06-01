package com.asms.ticketing.repository;

import com.asms.ticketing.entity.CheckInLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CheckInLogRepository extends JpaRepository<CheckInLog, UUID> {
}
