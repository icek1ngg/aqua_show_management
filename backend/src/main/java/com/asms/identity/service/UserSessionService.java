package com.asms.identity.service;

import com.asms.identity.dto.SessionDtos.SessionView;
import com.asms.identity.entity.User;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class UserSessionService {

    private final AuthSessionService authSessionService;

    public UserSessionService(AuthSessionService authSessionService) {
        this.authSessionService = authSessionService;
    }

    public List<SessionView> list(User user, UUID currentSessionId) {
        return authSessionService.list(user, currentSessionId);
    }

    public void revokeSession(User user, UUID sessionId) {
        authSessionService.revokeSession(user, sessionId);
    }

    public void revokeAllExceptCurrent(User user, UUID currentSessionId) {
        authSessionService.revokeAllExceptCurrent(user, currentSessionId);
    }
}
