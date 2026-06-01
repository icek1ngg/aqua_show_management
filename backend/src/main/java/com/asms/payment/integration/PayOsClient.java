package com.asms.payment.integration;

import com.asms.booking.entity.Booking;
import com.asms.core.exception.BadRequestException;
import com.asms.payment.dto.PayOsCallbackRequest;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.HexFormat;

@Component
public class PayOsClient {

    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final String PAYOS_BASE_URL = "https://api-merchant.payos.vn";

    private final String clientId;
    private final String apiKey;
    private final String checksumKey;
    private final String frontendBaseUrl;
    private final RestClient restClient;

    public PayOsClient(
            @Value("${asms.payos.client-id}") String clientId,
            @Value("${asms.payos.api-key}") String apiKey,
            @Value("${asms.payos.checksum-key}") String checksumKey,
            @Value("${asms.frontend.base-url}") String frontendBaseUrl
    ) {
        this.clientId = clientId;
        this.apiKey = apiKey;
        this.checksumKey = checksumKey;
        this.frontendBaseUrl = frontendBaseUrl;
        this.restClient = RestClient.builder()
                .baseUrl(PAYOS_BASE_URL)
                .build();
    }

    public PayOsPaymentLink createPaymentLink(Booking booking, String payosOrderCode) {
        if (clientId == null || clientId.isBlank() || apiKey == null || apiKey.isBlank() || checksumKey == null || checksumKey.isBlank()) {
            return new PayOsPaymentLink(createLocalPaymentLink(booking, payosOrderCode, "pending"), null, null, null, null, null, booking.getTotalAmount(), buildDescription(payosOrderCode));
        }

        long orderCode = Long.parseLong(payosOrderCode);
        long amount = booking.getTotalAmount().setScale(0, RoundingMode.HALF_UP).longValue();
        String returnUrl = createLocalPaymentLink(booking, payosOrderCode, "pending");
        String cancelUrl = createLocalPaymentLink(booking, payosOrderCode, "failed");
        String description = buildDescription(payosOrderCode);
        String signaturePayload = "amount=" + amount
                + "&cancelUrl=" + cancelUrl
                + "&description=" + description
                + "&orderCode=" + orderCode
                + "&returnUrl=" + returnUrl;

        Map<String, Object> request = new LinkedHashMap<>();
        request.put("orderCode", orderCode);
        request.put("amount", amount);
        request.put("description", description);
        request.put("buyerName", booking.getUser().getFullName());
        request.put("buyerEmail", booking.getUser().getEmail());
        request.put("buyerPhone", booking.getUser().getPhoneNumber());
        request.put("items", java.util.List.of(Map.of(
                "name", booking.getShowName(),
                "quantity", booking.getQuantity(),
                "price", amount
        )));
        request.put("cancelUrl", cancelUrl);
        request.put("returnUrl", returnUrl);
        request.put("expiredAt", booking.getExpiresAt().getEpochSecond());
        request.put("signature", hmacSha256Hex(signaturePayload));

        JsonNode response = restClient.post()
                .uri("/v2/payment-requests")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-client-id", clientId)
                .header("x-api-key", apiKey)
                .body(request)
                .retrieve()
                .body(JsonNode.class);

        if (response == null || !"00".equals(response.path("code").asText())) {
            String descriptionText = response == null ? "Unknown PayOS response" : response.path("desc").asText("PayOS rejected payment link");
            throw new BadRequestException(descriptionText);
        }

        String checkoutUrl = response.path("data").path("checkoutUrl").asText();
        if (checkoutUrl == null || checkoutUrl.isBlank()) {
            throw new BadRequestException("PayOS did not return a checkout URL");
        }

        JsonNode data = response.path("data");
        return new PayOsPaymentLink(
                checkoutUrl,
                data.path("qrCode").asText(null),
                data.path("paymentLinkId").asText(null),
                data.path("bin").asText(null),
                data.path("accountNumber").asText(null),
                data.path("accountName").asText(null),
                data.path("amount").isMissingNode() ? booking.getTotalAmount() : data.path("amount").decimalValue(),
                data.path("description").asText(description)
        );
    }

    private String buildDescription(String payosOrderCode) {
        String description = "ASMS" + payosOrderCode;
        return description.substring(0, Math.min(25, description.length()));
    }

    private String createLocalPaymentLink(Booking booking, String payosOrderCode, String status) {
        String baseUrl = frontendBaseUrl == null || frontendBaseUrl.isBlank()
                ? "http://localhost:5173"
                : frontendBaseUrl;

        return UriComponentsBuilder
                .fromUriString(baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl)
                .path("/payments/result")
                .queryParam("bookingId", booking.getId())
                .queryParam("orderCode", payosOrderCode)
                .queryParam("status", status)
                .build()
                .toUriString();
    }

    public boolean isValidCallback(PayOsCallbackRequest request) {
        if (checksumKey == null || checksumKey.isBlank()) {
            return true;
        }

        if (request.signature() == null || request.signature().isBlank()) {
            return false;
        }

        String payload;
        if (request.data() != null && !request.data().isEmpty()) {
            payload = canonicalData(request.data());
        } else {
            payload = request.resolvedOrderCode()
                    + "|"
                    + request.resolvedAmount().stripTrailingZeros().toPlainString()
                    + "|"
                    + request.resolvedStatus()
                    + "|"
                    + (request.resolvedTransactionId() == null ? "" : request.resolvedTransactionId());
        }
        String expected = hmacSha256Hex(payload);

        return MessageDigest.isEqual(
                expected.toLowerCase().getBytes(StandardCharsets.UTF_8),
                request.signature().toLowerCase().getBytes(StandardCharsets.UTF_8)
        );
    }

    private String canonicalData(Map<String, Object> data) {
        TreeMap<String, Object> sortedData = new TreeMap<>(data);
        return sortedData.entrySet()
                .stream()
                .filter((entry) -> entry.getValue() != null)
                .map((entry) -> entry.getKey() + "=" + stringify(entry.getValue()))
                .reduce((first, second) -> first + "&" + second)
                .orElse("");
    }

    private String stringify(Object value) {
        if (value instanceof Number number) {
            return new java.math.BigDecimal(number.toString()).stripTrailingZeros().toPlainString();
        }
        return Objects.toString(value, "");
    }

    private String hmacSha256Hex(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(checksumKey.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to verify PayOS callback", exception);
        }
    }
}
