package com.asms.identity.controller;

import com.asms.core.response.ApiResponse;
import com.asms.identity.dto.SessionDtos.SessionView;
import com.asms.identity.entity.User;
import com.asms.identity.security.JwtAuthenticationToken;
import com.asms.identity.service.UserSessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/sessions")
public class UserSessionController {

    private final UserSessionService userSessionService;

    public UserSessionController(UserSessionService userSessionService) {
        this.userSessionService = userSessionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SessionView>>> getUserSessions(JwtAuthenticationToken auth) {
        User user = (User) auth.getPrincipal();
        UUID currentSessionId = auth.getSessionId();
        return ResponseEntity.ok(ApiResponse.success(userSessionService.list(user, currentSessionId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> revokeSession(
            JwtAuthenticationToken auth,
            @PathVariable UUID id
    ) {
        User user = (User) auth.getPrincipal();
        userSessionService.revokeSession(user, id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> revokeAllExceptCurrent(JwtAuthenticationToken auth) {
        User user = (User) auth.getPrincipal();
        UUID currentSessionId = auth.getSessionId();
        userSessionService.revokeAllExceptCurrent(user, currentSessionId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
