package com.asms.identity.service;

import com.asms.identity.security.RefreshTokenCodec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class RefreshTokenCodecTest {

    private RefreshTokenCodec codec;
    private final String secret = "this-is-a-very-long-secret-key-for-hmac-sha-256";

    @BeforeEach
    void setUp() {
        codec = new RefreshTokenCodec(secret);
    }

    @Test
    void shouldGenerateAndDecodeTokenSuccessfully() {
        UUID sessionId = UUID.randomUUID();
        long generation = 1;

        String rawToken = codec.generateToken(sessionId, generation);

        assertNotNull(rawToken);
        String[] parts = rawToken.split("\\.");
        assertEquals(4, parts.length); // sessionId, generation, randomSecret, signature

        RefreshTokenCodec.DecodedToken decoded = codec.decode(rawToken);
        assertEquals(sessionId, decoded.sessionId());
        assertEquals(generation, decoded.generation());
        assertNotNull(decoded.randomSecret());
    }

    @Test
    void shouldThrowWhenDecodingInvalidFormat() {
        assertThrows(IllegalArgumentException.class, () -> codec.decode("invalid-format"));
        assertThrows(IllegalArgumentException.class, () -> codec.decode("one.two.three"));
    }

    @Test
    void shouldThrowWhenDecodingInvalidSignature() {
        UUID sessionId = UUID.randomUUID();
        String rawToken = codec.generateToken(sessionId, 1);
        String tamperedToken = rawToken.substring(0, rawToken.length() - 5) + "abcde";

        assertThrows(IllegalArgumentException.class, () -> codec.decode(tamperedToken));
    }

    @Test
    void shouldThrowWhenDecodingTamperedPayload() {
        UUID sessionId = UUID.randomUUID();
        String rawToken = codec.generateToken(sessionId, 1);
        String[] parts = rawToken.split("\\.");

        // Tamper with generation
        String tamperedPayload = parts[0] + ".2." + parts[2];
        String tamperedToken = tamperedPayload + "." + parts[3];

        assertThrows(IllegalArgumentException.class, () -> codec.decode(tamperedToken));
    }

    @Test
    void shouldHashTokenConsistently() {
        String token = "some-random-token";
        String hash1 = codec.hash(token);
        String hash2 = codec.hash(token);

        assertEquals(hash1, hash2);
        assertNotEquals(token, hash1);
    }
}
