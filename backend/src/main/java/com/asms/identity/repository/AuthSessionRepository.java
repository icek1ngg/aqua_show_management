package com.asms.identity.repository;

import com.asms.identity.entity.AuthSession;
import com.asms.identity.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AuthSessionRepository extends JpaRepository<AuthSession, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM AuthSession s WHERE s.id = :id")
    Optional<AuthSession> findByIdForUpdate(@Param("id") UUID id);

    List<AuthSession> findByUserOrderByLastSeenAtDesc(User user);
    
    void deleteByUserAndId(User user, UUID id);
    
    void deleteByUser(User user);
}
