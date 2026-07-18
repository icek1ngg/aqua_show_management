package com.asms.identity.dto;

import com.asms.identity.dto.AuthDtos.RegisterRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RegisterRequestValidationTest {

    private static final String VERSION = AuthDtos.LEGAL_DOCUMENT_VERSION;

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void acceptsTheSupportedRegistrationContract() {
        RegisterRequest request = new RegisterRequest(
                "Nguyen", "Van A", "user@example.com", "0123456789", "abc123", true, VERSION
        );

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void rejectsPasswordWithoutLetterOrDigitAndMissingConsent() {
        RegisterRequest request = new RegisterRequest(
                "Nguyen", "Van A", "user@example.com", "0123456789", "123456", false, "old"
        );

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("password", "acceptedTerms", "legalDocumentVersion");
    }
}
