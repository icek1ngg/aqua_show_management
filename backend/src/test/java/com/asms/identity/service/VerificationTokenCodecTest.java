package com.asms.identity.service;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class VerificationTokenCodecTest {

    @Test
    void createsAUuidAndDeterministicSha256Digest() {
        VerificationTokenCodec codec = new VerificationTokenCodec();
        VerificationTokenCodec.IssuedToken issued = codec.issue();

        assertThatCode(() -> UUID.fromString(issued.rawToken())).doesNotThrowAnyException();
        assertThat(issued.tokenHash()).matches("[0-9a-f]{64}");
        assertThat(codec.hash(issued.rawToken())).isEqualTo(issued.tokenHash());
        assertThat(issued.tokenHash()).doesNotContain(issued.rawToken());
    }
}
