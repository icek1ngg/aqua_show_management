package com.asms.identity.security;

import com.asms.identity.entity.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {

    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;
    private final String secret;
    private final long expirationMs;

    public JwtService(
            ObjectMapper objectMapper,
            @Value("${asms.jwt.secret}") String secret,
            @Value("${asms.jwt.expiration-ms}") long expirationMs
    ) {
        this.objectMapper = objectMapper;
        this.secret = secret;
        this.expirationMs = expirationMs;
    }

    public String generateToken(User user, String sid) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(expirationMs);

        Map<String, Object> header = Map.of(
                "alg", "HS256",
                "typ", "JWT"
        );

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", user.getEmail());
        payload.put("sid", sid);
        payload.put("jti", java.util.UUID.randomUUID().toString());
        payload.put("iss", "asms");
        payload.put("aud", "asms-client");
        payload.put("authVersion", user.getAuthVersion());
        payload.put("role", user.getRole().name());
        payload.put("iat", now.getEpochSecond());
        payload.put("exp", expiresAt.getEpochSecond());

        String encodedHeader = encodeJson(header);
        String encodedPayload = encodeJson(payload);
        String content = encodedHeader + "." + encodedPayload;

        return content + "." + sign(content);
    }

    public String extractSubject(String token) {
        return getClaims(token).get("sub").toString();
    }
    
    public Map<String, Object> extractClaims(String token) {
        return getClaims(token);
    }

    public boolean isValid(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return false;
            }
            
            // Check alg header
            byte[] decodedHeader = Base64.getUrlDecoder().decode(parts[0]);
            Map<String, Object> header = objectMapper.readValue(decodedHeader, MAP_TYPE);
            if (!"HS256".equals(header.get("alg"))) {
                return false;
            }

            String content = parts[0] + "." + parts[1];
            if (!sign(content).equals(parts[2])) {
                return false;
            }

            Map<String, Object> claims = getClaims(token);
            
            if (!"asms".equals(claims.get("iss")) || !"asms-client".equals(claims.get("aud"))) {
                return false;
            }
            
            if (!claims.containsKey("sid") || !claims.containsKey("authVersion")) {
                return false;
            }

            Object exp = claims.get("exp");
            long expiresAt = exp instanceof Number number ? number.longValue() : Long.parseLong(exp.toString());
            return expiresAt > Instant.now().getEpochSecond();
        } catch (Exception exception) {
            return false;
        }
    }

    public long getExpirationSeconds() {
        return expirationMs / 1000;
    }

    private Map<String, Object> getClaims(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid JWT");
        }

        try {
            byte[] decodedPayload = Base64.getUrlDecoder().decode(parts[1]);
            return objectMapper.readValue(decodedPayload, MAP_TYPE);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Invalid JWT payload", exception);
        }
    }

    private String encodeJson(Map<String, Object> value) {
        try {
            return Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(objectMapper.writeValueAsBytes(value));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to encode JWT", exception);
        }
    }

    private String sign(String content) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            return Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(mac.doFinal(content.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign JWT", exception);
        }
    }
}
