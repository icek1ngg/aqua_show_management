package com.asms.catalog;

import com.asms.catalog.controller.PublicScheduleController;
import com.asms.catalog.dto.CatalogDtos.BookingScheduleResponse;
import com.asms.catalog.enums.ScheduleStatus;
import com.asms.catalog.service.PublicShowService;
import com.asms.core.exception.GlobalExceptionHandler;
import com.asms.core.exception.NotFoundException;
import com.asms.core.security.JwtAuthenticationFilter;
import com.asms.core.security.SecurityConfig;
import com.asms.core.security.FrontendOriginPolicy;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.security.JwtService;
import com.asms.identity.security.OAuth2AuthenticationSuccessHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PublicScheduleController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, FrontendOriginPolicy.class, GlobalExceptionHandler.class})
class PublicScheduleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PublicShowService publicShowService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @Test
    void anonymousScheduleRequestReturnsSerializedBookingSnapshot() throws Exception {
        UUID scheduleId = UUID.randomUUID();
        UUID showId = UUID.randomUUID();
        UUID venueId = UUID.randomUUID();
        LocalDateTime start = LocalDateTime.of(2026, 8, 1, 19, 0);
        BookingScheduleResponse response = new BookingScheduleResponse(
                scheduleId,
                showId,
                "Aqua Journey",
                "An ocean adventure",
                "/images/aqua.jpg",
                ScheduleStatus.ACTIVE,
                start,
                start.plusMinutes(45),
                venueId,
                "Main Plaza Pool",
                "Zone A",
                new BigDecimal("2500.00"),
                new BigDecimal("6250.00"),
                new BigDecimal("3750.00"),
                100,
                20,
                10,
                98,
                17,
                9
        );
        when(publicShowService.getSchedule(scheduleId)).thenReturn(response);

        mockMvc.perform(get("/api/schedules/{id}", scheduleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.scheduleId").value(scheduleId.toString()))
                .andExpect(jsonPath("$.data.showId").value(showId.toString()))
                .andExpect(jsonPath("$.data.showTitle").value("Aqua Journey"))
                .andExpect(jsonPath("$.data.venueId").value(venueId.toString()))
                .andExpect(jsonPath("$.data.venueName").value("Main Plaza Pool"))
                .andExpect(jsonPath("$.data.standardPrice").value(2500.0))
                .andExpect(jsonPath("$.data.vipPrice").value(6250.0))
                .andExpect(jsonPath("$.data.familyPrice").value(3750.0))
                .andExpect(jsonPath("$.data.standardAvailableTickets").value(98))
                .andExpect(jsonPath("$.data.standardBasePrice").doesNotExist());
    }

    @Test
    void anonymousMissingScheduleRequestReturnsNotFoundResponse() throws Exception {
        UUID scheduleId = UUID.randomUUID();
        when(publicShowService.getSchedule(scheduleId)).thenThrow(new NotFoundException("Schedule not found"));

        mockMvc.perform(get("/api/schedules/{id}", scheduleId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Schedule not found"));
    }
}
