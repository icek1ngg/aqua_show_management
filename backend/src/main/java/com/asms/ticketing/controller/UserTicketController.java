package com.asms.ticketing.controller;

import com.asms.core.response.ApiResponse;
import com.asms.identity.entity.User;
import com.asms.ticketing.dto.MyTicketDtos.PageMyTicketResponse;
import com.asms.ticketing.service.UserTicketService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
public class UserTicketController {
    private final UserTicketService userTicketService;

    public UserTicketController(UserTicketService userTicketService) {
        this.userTicketService = userTicketService;
    }

    @GetMapping("/my")
    public ApiResponse<PageMyTicketResponse> getMyTickets(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(name = "q", required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID bookingId
    ) {
        return ApiResponse.success("Tickets fetched successfully",
                userTicketService.getMyTickets(user, page, size, keyword, status, bookingId));
    }
}
