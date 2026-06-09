package com.asms.payment;

import com.asms.payment.dto.PayOsCallbackRequest;
import com.asms.payment.integration.PayOsClient;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PayOsClientTest {

    @Test
    void blankChecksumRejectsCallbackByDefault() {
        PayOsClient client = client("", false, "");
        assertThat(client.isValidCallback(callback("signature"))).isFalse();
    }

    @Test
    void blankChecksumAllowsCallbackOnlyWhenExplicitlyEnabledOutsideProduction() {
        PayOsClient client = client("", true, "dev");
        assertThat(client.isValidCallback(callback(""))).isTrue();
    }

    @Test
    void productionProfileRejectsUnsignedCallbackEvenWhenFlagIsEnabled() {
        PayOsClient client = client("", true, "production");
        assertThat(client.isValidCallback(callback(""))).isFalse();
    }

    @Test
    void invalidSignatureIsRejected() {
        PayOsClient client = client("checksum-secret", false, "");
        assertThat(client.isValidCallback(callback("invalid"))).isFalse();
    }

    @Test
    void validSignatureIsAccepted() throws Exception {
        String checksumKey = "checksum-secret";
        Map<String, Object> data = callbackData();
        String payload = "amount=100000&orderCode=123456789&reference=transaction-1";
        PayOsClient client = client(checksumKey, false, "");

        assertThat(client.isValidCallback(callback(sign(checksumKey, payload), data))).isTrue();
    }

    private PayOsClient client(String checksumKey, boolean allowUnsignedCallbacks, String activeProfiles) {
        return new PayOsClient("", "", checksumKey, allowUnsignedCallbacks, activeProfiles, "http://localhost:5173");
    }

    private PayOsCallbackRequest callback(String signature) {
        return callback(signature, callbackData());
    }

    private PayOsCallbackRequest callback(String signature, Map<String, Object> data) {
        return new PayOsCallbackRequest(
                "00",
                "success",
                true,
                data,
                signature,
                null,
                null,
                null,
                null
        );
    }

    private Map<String, Object> callbackData() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("orderCode", 123456789);
        data.put("amount", new BigDecimal("100000"));
        data.put("reference", "transaction-1");
        return data;
    }

    private String sign(String checksumKey, String payload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(checksumKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    }
}
