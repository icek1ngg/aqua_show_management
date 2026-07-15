package com.asms.core.response;

import com.asms.core.exception.ErrorCode;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ApiResponseTest {

    @Test
    void codedFailureCarriesStableCodeWithoutChangingTheEnvelope() {
        ApiResponse<Void> response = ApiResponse.failure(
                ErrorCode.EMAIL_VERIFICATION_REQUIRED.name(),
                "Verify your email"
        );

        assertThat(response.success()).isFalse();
        assertThat(response.code()).isEqualTo("EMAIL_VERIFICATION_REQUIRED");
        assertThat(response.message()).isEqualTo("Verify your email");
        assertThat(response.data()).isNull();
    }
}
