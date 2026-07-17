package com.asms.checkout.controller;

import com.asms.checkout.dto.CheckoutDtos.CheckoutReviewItem;
import com.asms.checkout.dto.CheckoutDtos.CheckoutReviewRequiredData;
import com.asms.checkout.dto.CheckoutDtos.StartPaymentResponse;
import com.asms.checkout.exception.CheckoutReviewRequiredException;
import com.asms.checkout.service.CheckoutService;
import com.asms.core.exception.GlobalExceptionHandler;
import com.asms.core.security.CsrfAndOriginValidationFilter;
import com.asms.core.security.FrontendOriginPolicy;
import com.asms.core.security.JwtAuthenticationFilter;
import com.asms.core.security.SecurityConfig;
import com.asms.identity.entity.User;
import com.asms.identity.repository.AuthSessionRepository;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.security.JwtService;
import com.asms.identity.security.OAuth2AuthenticationSuccessHandler;
import com.asms.payment.dto.CreatePaymentResponse;
import com.asms.payment.enums.PaymentStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CheckoutController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, CsrfAndOriginValidationFilter.class,
        FrontendOriginPolicy.class, GlobalExceptionHandler.class})
class CheckoutControllerTest {

    private static final String ENDPOINT = "/api/checkout/start-payment";
    private static final String ORIGIN = "http://localhost:5173";
    private static final String VALID_BODY = """
            {
              "idempotencyKey": "checkout-key-1",
              "items": [{
                "scheduleId": "0aa40332-6318-492f-ae61-58a02e766cdf",
                "ticketType": "VIP",
                "quantity": 2,
                "expectedUnitPrice": 250000
              }]
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CheckoutService checkoutService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private AuthSessionRepository authSessionRepository;

    @MockBean
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @Test
    void anonymousRequestIsRejectedBeforeCheckoutService() throws Exception {
        mockMvc.perform(post(ENDPOINT)
                        .header("Origin", ORIGIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Authentication required"));

        verifyNoInteractions(checkoutService);
    }

    @Test
    void missingIdempotencyKeyIsRejectedByBeanValidation() throws Exception {
        mockMvc.perform(authenticatedPost(testUser(), """
                        {"items":[{"scheduleId":"schedule-1","ticketType":"VIP","quantity":2,"expectedUnitPrice":250000}]}
                        """)
                        .header("Idempotency-Key", "header-key-must-not-satisfy-body-contract"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.idempotencyKey").value("Idempotency key is required"));

        verifyNoInteractions(checkoutService);
    }

    @Test
    void nullIdempotencyKeyIsRejectedByBeanValidation() throws Exception {
        assertInvalidBody("""
                {"idempotencyKey":null,"items":[{"scheduleId":"schedule-1","ticketType":"VIP","quantity":2,"expectedUnitPrice":250000}]}
                """, "idempotencyKey", "Idempotency key is required");
    }

    @Test
    void blankIdempotencyKeyIsRejectedByBeanValidation() throws Exception {
        assertInvalidBody("""
                {"idempotencyKey":"   ","items":[{"scheduleId":"schedule-1","ticketType":"VIP","quantity":2,"expectedUnitPrice":250000}]}
                """, "idempotencyKey", "Idempotency key is required");
    }

    @Test
    void invalidNestedItemAndEmptyItemsAreRejectedByBeanValidation() throws Exception {
        assertInvalidBody("""
                {"idempotencyKey":"checkout-key-1","items":[{"ticketType":"VIP","quantity":2,"expectedUnitPrice":250000}]}
                """, "items[0].scheduleId", "Schedule ID is required");

        assertInvalidBody("""
                {"idempotencyKey":"checkout-key-1","items":[]}
                """, "items", "Items are required");
    }

    @Test
    void checkoutReviewConflictIncludesMachineCodeAndAuthoritativeData() throws Exception {
        User authenticatedUser = testUser();
        CheckoutReviewRequiredData data = new CheckoutReviewRequiredData(List.of(
                new CheckoutReviewItem(
                        "0aa40332-6318-492f-ae61-58a02e766cdf", "VIP", 2, 1,
                        new BigDecimal("250000"), new BigDecimal("275000"))
        ));
        when(checkoutService.startPayment(any(), same(authenticatedUser)))
                .thenThrow(new CheckoutReviewRequiredException(data));

        mockMvc.perform(authenticatedPost(authenticatedUser, VALID_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Checkout review required"))
                .andExpect(jsonPath("$.code").value("CHECKOUT_REVIEW_REQUIRED"))
                .andExpect(jsonPath("$.data.items[0].scheduleId").value("0aa40332-6318-492f-ae61-58a02e766cdf"))
                .andExpect(jsonPath("$.data.items[0].requestedQuantity").value(2))
                .andExpect(jsonPath("$.data.items[0].availableQuantity").value(1))
                .andExpect(jsonPath("$.data.items[0].expectedUnitPrice").value(250000))
                .andExpect(jsonPath("$.data.items[0].currentUnitPrice").value(275000));
    }

    @Test
    void successSerializesCompletePaymentSession() throws Exception {
        User authenticatedUser = testUser();
        UUID bookingId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();
        Instant expiresAt = Instant.parse("2026-08-01T12:30:00Z");
        CreatePaymentResponse payment = new CreatePaymentResponse(
                bookingId, paymentId, "123456789", "https://pay.example/payment",
                "https://pay.example/checkout", "qr-payload", "plink-1", "970422",
                "1234567890", "AQUA SHOW", new BigDecimal("500000"),
                "ASMS payment", PaymentStatus.PENDING, 1800);
        StartPaymentResponse response = new StartPaymentResponse(
                bookingId.toString(), "PENDING", expiresAt,
                List.of(Map.of("scheduleId", "0aa40332-6318-492f-ae61-58a02e766cdf")),
                2, new BigDecimal("500000"), payment);
        when(checkoutService.startPayment(any(), same(authenticatedUser))).thenReturn(response);

        mockMvc.perform(authenticatedPost(authenticatedUser, VALID_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingId").value(bookingId.toString()))
                .andExpect(jsonPath("$.bookingStatus").value("PENDING"))
                .andExpect(jsonPath("$.expiresAt").value("2026-08-01T12:30:00Z"))
                .andExpect(jsonPath("$.totalQuantity").value(2))
                .andExpect(jsonPath("$.totalAmount").value(500000))
                .andExpect(jsonPath("$.payment.bookingId").value(bookingId.toString()))
                .andExpect(jsonPath("$.payment.paymentId").value(paymentId.toString()))
                .andExpect(jsonPath("$.payment.payosOrderCode").value("123456789"))
                .andExpect(jsonPath("$.payment.paymentUrl").value("https://pay.example/payment"))
                .andExpect(jsonPath("$.payment.checkoutUrl").value("https://pay.example/checkout"))
                .andExpect(jsonPath("$.payment.qrCode").value("qr-payload"))
                .andExpect(jsonPath("$.payment.paymentLinkId").value("plink-1"))
                .andExpect(jsonPath("$.payment.bankBin").value("970422"))
                .andExpect(jsonPath("$.payment.accountNumber").value("1234567890"))
                .andExpect(jsonPath("$.payment.accountName").value("AQUA SHOW"))
                .andExpect(jsonPath("$.payment.amount").value(500000))
                .andExpect(jsonPath("$.payment.description").value("ASMS payment"))
                .andExpect(jsonPath("$.payment.status").value("PENDING"))
                .andExpect(jsonPath("$.payment.expiresInSeconds").value(1800));
    }

    private void assertInvalidBody(String body, String field, String message) throws Exception {
        mockMvc.perform(authenticatedPost(testUser(), body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors['" + field + "']").value(message));
        verifyNoInteractions(checkoutService);
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder authenticatedPost(
            User authenticatedUser,
            String body
    ) {
        return post(ENDPOINT)
                .with(user(authenticatedUser))
                .header("Origin", ORIGIN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body);
    }

    private User testUser() {
        return new User("Doe", "Jane", "jane@example.com", null, "hashed");
    }
}
