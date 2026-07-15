package com.asms.identity.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "auth_sessions")
public class AuthSession {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true, length = 64)
    private String currentTokenHash;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant lastSeenAt;

    @Column(nullable = false)
    private long generation;

    @Column(length = 255)
    private String device;

    @Column(length = 45)
    private String ipPrefix;

    protected AuthSession() {
    }

    public AuthSession(User user, String currentTokenHash, Instant expiresAt, String device, String ipPrefix) {
        this.id = UUID.randomUUID();
        this.user = user;
        this.currentTokenHash = currentTokenHash;
        this.expiresAt = expiresAt;
        this.generation = 1;
        this.device = device;
        this.ipPrefix = ipPrefix;
    }

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (lastSeenAt == null) {
            lastSeenAt = createdAt;
        }
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getCurrentTokenHash() {
        return currentTokenHash;
    }

    public void setCurrentTokenHash(String currentTokenHash) {
        this.currentTokenHash = currentTokenHash;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getLastSeenAt() {
        return lastSeenAt;
    }

    public void setLastSeenAt(Instant lastSeenAt) {
        this.lastSeenAt = lastSeenAt;
    }

    public long getGeneration() {
        return generation;
    }

    public void setGeneration(long generation) {
        this.generation = generation;
    }

    public String getDevice() {
        return device;
    }

    public void setDevice(String device) {
        this.device = device;
    }

    public String getIpPrefix() {
        return ipPrefix;
    }

    public void setIpPrefix(String ipPrefix) {
        this.ipPrefix = ipPrefix;
    }
}
