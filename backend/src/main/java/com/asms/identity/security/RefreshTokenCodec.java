package com.asms.identity.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Component
public class RefreshTokenCodec {

    private final byte[] secretKeyBytes;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenCodec(@Value("${asms.jwt.refresh-token.secret}") String secret) {
        this.secretKeyBytes = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String generateToken(UUID sessionId, long generation) {
        String randomSecret = generateRandomSecret();
        String payload = sessionId.toString() + "." + generation + "." + randomSecret;
        String signature = sign(payload);
        return payload + "." + signature;
    }

    public DecodedToken decode(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Token is missing");
        }
        String[] parts = rawToken.split("\\.");
        if (parts.length != 4) {
            throw new IllegalArgumentException("Invalid token format");
        }

        String payload = parts[0] + "." + parts[1] + "." + parts[2];
        String signature = parts[3];

        String expectedSignature = sign(payload);
        if (!MessageDigest.isEqual(signature.getBytes(StandardCharsets.UTF_8), expectedSignature.getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException("Invalid token signature");
        }

        try {
            return new DecodedToken(
                    UUID.fromString(parts[0]),
                    Long.parseLong(parts[1]),
                    parts[2]
            );
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid token payload format", e);
        }
    }

    public String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to hash refresh token", exception);
        }
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKeyBytes, "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hmacBytes);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign refresh token", e);
        }
    }

    private String generateRandomSecret() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public record DecodedToken(UUID sessionId, long generation, String randomSecret) {
    }
}
