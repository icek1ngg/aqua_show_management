package com.asms.payment.integration;

import com.asms.booking.entity.Booking;
import com.asms.core.exception.BadRequestException;
import com.asms.payment.dto.PayOsCallbackRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.HexFormat;

@Component
public class PayOsClient {

    private static final Logger log = LoggerFactory.getLogger(PayOsClient.class);
    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final String PAYOS_BASE_URL = "https://api-merchant.payos.vn";
    private static final BigDecimal MINIMUM_VND_AMOUNT = new BigDecimal("2000");

    private final String clientId;
    private final String apiKey;
    private final String checksumKey;
    private final boolean allowUnsignedCallbacks;
    private final String activeProfiles;
    private final String frontendBaseUrl;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public PayOsClient(
            @Value("${asms.payos.client-id}") String clientId,
            @Value("${asms.payos.api-key}") String apiKey,
            @Value("${asms.payos.checksum-key}") String checksumKey,
            @Value("${asms.payos.allow-unsigned-callbacks:false}") boolean allowUnsignedCallbacks,
            @Value("${spring.profiles.active:}") String activeProfiles,
            @Value("${asms.frontend.base-url}") String frontendBaseUrl,
            ObjectMapper objectMapper
    ) {
        this.clientId = clientId;
        this.apiKey = apiKey;
        this.checksumKey = checksumKey;
        this.allowUnsignedCallbacks = allowUnsignedCallbacks;
        this.activeProfiles = activeProfiles == null ? "" : activeProfiles;
        this.frontendBaseUrl = frontendBaseUrl;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl(PAYOS_BASE_URL)
                .build();
    }

    public PayOsPaymentLink createPaymentLink(Booking booking, String payosOrderCode) {
        if (clientId == null || clientId.isBlank() || apiKey == null || apiKey.isBlank() || checksumKey == null || checksumKey.isBlank()) {
            return new PayOsPaymentLink(createLocalPaymentLink(booking, payosOrderCode, "pending"), null, null, null, null, null, booking.getTotalAmount(), buildDescription(payosOrderCode));
        }

        long orderCode = Long.parseLong(payosOrderCode);
        long amount = toPayOsVndAmount(booking.getTotalAmount());
        long itemPrice = toPayOsVndAmount(booking.getUnitPrice());
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
                "price", itemPrice
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

    public PayOsPaymentStatus getPaymentStatus(String orderCodeOrPaymentLinkId) {
        if (orderCodeOrPaymentLinkId == null || orderCodeOrPaymentLinkId.isBlank()) {
            throw new BadRequestException("PayOS order code is required");
        }
        if (clientId == null || clientId.isBlank() || apiKey == null || apiKey.isBlank()) {
            return new PayOsPaymentStatus(
                    orderCodeOrPaymentLinkId,
                    "PENDING",
                    com.asms.payment.enums.PaymentStatus.PENDING,
                    null,
                    null,
                    null
            );
        }

        JsonNode response = restClient.get()
                .uri("/v2/payment-requests/{id}", orderCodeOrPaymentLinkId)
                .header("x-client-id", clientId)
                .header("x-api-key", apiKey)
                .retrieve()
                .body(JsonNode.class);

        if (response == null || !"00".equals(response.path("code").asText())) {
            String descriptionText = response == null
                    ? "Unknown PayOS response"
                    : response.path("desc").asText("Unable to query PayOS payment status");
            throw new BadRequestException(descriptionText);
        }

        JsonNode data = response.path("data");
        String providerStatus = data.path("status").asText("PENDING").trim().toUpperCase(Locale.ROOT);
        JsonNode transaction = firstTransaction(data.path("transactions"));
        String transactionId = firstText(transaction, "reference", "transactionId");
        Instant paidAt = parsePayOsInstant(firstText(transaction, "transactionDateTime", "paidAt"));
        BigDecimal amount = data.path("amountPaid").isNumber()
                ? data.path("amountPaid").decimalValue()
                : data.path("amount").isNumber() ? data.path("amount").decimalValue() : null;

        return new PayOsPaymentStatus(
                data.path("orderCode").asText(orderCodeOrPaymentLinkId),
                providerStatus,
                mapProviderStatus(providerStatus),
                transactionId,
                paidAt,
                amount
        );
    }

    private String buildDescription(String payosOrderCode) {
        String description = "ASMS" + payosOrderCode;
        return description.substring(0, Math.min(25, description.length()));
    }

    private com.asms.payment.enums.PaymentStatus mapProviderStatus(String providerStatus) {
        return switch (providerStatus) {
            case "PAID", "SUCCESS", "SUCCESSFUL" -> com.asms.payment.enums.PaymentStatus.SUCCESS;
            case "EXPIRED" -> com.asms.payment.enums.PaymentStatus.EXPIRED;
            case "CANCELLED", "CANCELED", "FAILED", "UNDERPAID" -> com.asms.payment.enums.PaymentStatus.FAILED;
            default -> com.asms.payment.enums.PaymentStatus.PENDING;
        };
    }

    private JsonNode firstTransaction(JsonNode transactions) {
        if (transactions == null || transactions.isMissingNode() || transactions.isNull()) {
            return null;
        }
        if (transactions.isArray()) {
            return transactions.isEmpty() ? null : transactions.get(0);
        }
        if (transactions.isObject()) {
            if (transactions.has("reference") || transactions.has("transactionId")) {
                return transactions;
            }
            var elements = transactions.elements();
            return elements.hasNext() ? elements.next() : transactions;
        }
        return null;
    }

    private String firstText(JsonNode node, String... fieldNames) {
        if (node == null) {
            return null;
        }
        for (String fieldName : fieldNames) {
            String value = node.path(fieldName).asText(null);
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private Instant parsePayOsInstant(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ignored) {
            try {
                return LocalDateTime.parse(value, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                        .atZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                        .toInstant();
            } catch (DateTimeParseException invalidPayOsDate) {
                return null;
            }
        }
    }

    private long toPayOsVndAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(MINIMUM_VND_AMOUNT) < 0) {
            throw new BadRequestException("PayOS amount must be at least 2000 VND");
        }

        try {
            return amount.setScale(0, RoundingMode.UNNECESSARY).longValueExact();
        } catch (ArithmeticException exception) {
            throw new BadRequestException("PayOS amount must be a whole VND amount");
        }
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
        if (request == null) {
            return false;
        }
        if (checksumKey == null || checksumKey.isBlank()) {
            if (!allowUnsignedCallbacks || isProductionProfile()) {
                return false;
            }
            log.warn("PayOS callback signature validation is disabled because unsigned callbacks are explicitly allowed");
            return true;
        }

        if (request.signature() == null || request.signature().isBlank()) {
            return false;
        }
        if (request.data() == null || request.data().isEmpty()) {
            return false;
        }

        try {
            String payload = canonicalData(request.data());
            String expected = hmacSha256Hex(payload);
            return MessageDigest.isEqual(
                    expected.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8),
                    request.signature().toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8)
            );
        } catch (RuntimeException exception) {
            log.warn("Unable to canonicalize PayOS callback data for signature validation");
            return false;
        }
    }

    private boolean isProductionProfile() {
        return java.util.Arrays.stream(activeProfiles.split(","))
                .map(String::trim)
                .anyMatch((profile) -> profile.equalsIgnoreCase("prod") || profile.equalsIgnoreCase("production"));
    }

    private String canonicalData(Map<String, Object> data) {
        TreeMap<String, Object> sortedData = new TreeMap<>(data);
        return sortedData.entrySet()
                .stream()
                .map((entry) -> entry.getKey() + "=" + stringify(entry.getValue()))
                .reduce((first, second) -> first + "&" + second)
                .orElse("");
    }

    private String stringify(Object value) {
        if (value == null || "null".equals(value) || "undefined".equals(value)) {
            return "";
        }
        if (value instanceof Number number) {
            return new java.math.BigDecimal(number.toString()).stripTrailingZeros().toPlainString();
        }
        if (value instanceof Map<?, ?> map) {
            return writeCanonicalJson(sortNestedMap(map));
        }
        if (value instanceof Iterable<?> iterable) {
            List<Object> normalized = new java.util.ArrayList<>();
            iterable.forEach((item) -> normalized.add(normalizeNestedValue(item)));
            return writeCanonicalJson(normalized);
        }
        return String.valueOf(value);
    }

    private Map<String, Object> sortNestedMap(Map<?, ?> map) {
        TreeMap<String, Object> sorted = new TreeMap<>();
        map.forEach((key, value) -> sorted.put(String.valueOf(key), normalizeNestedValue(value)));
        return sorted;
    }

    private Object normalizeNestedValue(Object value) {
        if (value instanceof Map<?, ?> map) {
            return sortNestedMap(map);
        }
        if (value instanceof Iterable<?> iterable) {
            List<Object> normalized = new java.util.ArrayList<>();
            iterable.forEach((item) -> normalized.add(normalizeNestedValue(item)));
            return normalized;
        }
        if (value instanceof Number number) {
            return new java.math.BigDecimal(number.toString()).stripTrailingZeros();
        }
        return value;
    }

    private String writeCanonicalJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to canonicalize PayOS callback data", exception);
        }
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
