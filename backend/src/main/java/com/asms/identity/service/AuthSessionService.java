package com.asms.identity.service;

import com.asms.identity.dto.SessionDtos.ClientContext;
import com.asms.identity.dto.SessionDtos.SessionIssue;
import com.asms.identity.dto.SessionDtos.SessionRotation;
import com.asms.identity.dto.SessionDtos.SessionView;
import com.asms.identity.entity.User;

import java.util.List;
import java.util.UUID;

public interface AuthSessionService {

    SessionIssue create(User user, boolean rememberMe, ClientContext context);

    SessionRotation rotate(String rawRefreshToken, ClientContext context);

    void revoke(String rawRefreshToken);

    void revokeSession(User user, UUID sessionId);

    void revokeAll(User user);

    List<SessionView> list(User user, UUID currentSessionId);
}
