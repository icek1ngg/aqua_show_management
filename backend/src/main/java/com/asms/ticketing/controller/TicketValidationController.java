package com.asms.ticketing.controller;

import com.asms.core.response.ApiResponse;
import com.asms.identity.entity.User;
import com.asms.ticketing.dto.ValidateQrRequest;
import com.asms.ticketing.dto.ValidateQrResponse;
import com.asms.ticketing.service.TicketValidationService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets")
public class TicketValidationController {

    private final TicketValidationService ticketValidationService;

    public TicketValidationController(TicketValidationService ticketValidationService) {
        this.ticketValidationService = ticketValidationService;
    }

    @PostMapping("/validate")
    @PreAuthorize("hasRole('STAFF')")
    public ApiResponse<ValidateQrResponse> validateQr(@Valid @RequestBody ValidateQrRequest request, @AuthenticationPrincipal User staff) {
        return ApiResponse.success(ticketValidationService.validateQr(request, staff));
    }
}
