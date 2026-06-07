package com.asms.identity.repository;

import com.asms.identity.entity.RefreshToken;
import com.asms.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update RefreshToken token set token.revoked = true where token.user = :user and token.revoked = false")
    int revokeActiveRefreshTokensByUser(User user);
}
