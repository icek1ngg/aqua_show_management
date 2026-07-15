package com.asms.identity.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AuthTokenCodecTest {

    @Test
    void createsRandomTokenAndDeterministicSha256Digest() {
        AuthTokenCodec codec = new AuthTokenCodec();
        AuthTokenCodec.IssuedToken issued = codec.issue();

        assertThat(issued.rawToken()).hasSize(43);
        assertThat(issued.tokenHash()).hasSize(43);
        assertThat(codec.hash(issued.rawToken())).isEqualTo(issued.tokenHash());
        assertThat(issued.tokenHash()).doesNotContain(issued.rawToken());
    }
}
