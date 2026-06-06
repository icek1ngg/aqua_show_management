package com.asms.identity.repository;

import com.asms.identity.entity.User;
import com.asms.identity.enums.UserRole;
import com.asms.identity.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    boolean existsByEmailIgnoreCase(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByGoogleId(String googleId);

    long countByRoleAndStatus(UserRole role, UserStatus status);
}
