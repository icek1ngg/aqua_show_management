package com.asms.identity.repository;

import com.asms.identity.entity.AuthChallenge;
import com.asms.identity.entity.User;
import com.asms.identity.enums.AuthChallengeType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuthChallengeRepository extends JpaRepository<AuthChallenge, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM AuthChallenge c WHERE c.tokenHash = :tokenHash")
    Optional<AuthChallenge> findByTokenHashForUpdate(String tokenHash);

    @Modifying
    @Query("DELETE FROM AuthChallenge c WHERE c.user = :user AND c.type = :type")
    void deleteByUserAndType(User user, AuthChallengeType type);
    
    @Query("SELECT c.user.id FROM AuthChallenge c WHERE c.tokenHash = :tokenHash")
    Optional<UUID> findUserIdByTokenHash(String tokenHash);
}
