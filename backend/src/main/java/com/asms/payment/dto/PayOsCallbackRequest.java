package com.asms.payment.dto;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.Map;

public record PayOsCallbackRequest(
        String code,
        String desc,
        Boolean success,
        Map<String, Object> data,
        String signature,
        String payosOrderCode,
        String transactionId,
        BigDecimal amount,
        String status
) {

    public String resolvedOrderCode() {
        Object orderCode = data == null ? null : data.get("orderCode");
        return orderCode == null ? payosOrderCode : orderCode.toString();
    }

    public String resolvedTransactionId() {
        Object reference = data == null ? null : data.get("reference");
        return reference == null ? transactionId : reference.toString();
    }

    public BigDecimal resolvedAmount() {
        Object webhookAmount = data == null ? null : data.get("amount");
        if (webhookAmount == null) {
            return amount;
        }
        if (webhookAmount instanceof Number number) {
            return BigDecimal.valueOf(number.longValue());
        }
        return new BigDecimal(webhookAmount.toString());
    }

    public String resolvedStatus() {
        if (status != null && !status.isBlank()) {
            return status;
        }

        if (Boolean.TRUE.equals(success) && "00".equals(code)) {
            return "SUCCESS";
        }

        Object dataCode = data == null ? null : data.get("code");
        if (Boolean.TRUE.equals(success) && "00".equals(String.valueOf(dataCode))) {
            return "SUCCESS";
        }

        String normalizedCode = code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
        if ("EXPIRED".equals(normalizedCode) || "CANCELLED".equals(normalizedCode)) {
            return "EXPIRED";
        }

        return "FAILED";
    }
}
