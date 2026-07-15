package com.asms.identity.security;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.UUID;

public class JwtAuthenticationToken extends UsernamePasswordAuthenticationToken {

    private final UUID sessionId;

    public JwtAuthenticationToken(Object principal, Object credentials, Collection<? extends GrantedAuthority> authorities, UUID sessionId) {
        super(principal, credentials, authorities);
        this.sessionId = sessionId;
    }

    public UUID getSessionId() {
        return sessionId;
    }
}
