package com.asms.ticketing.dto;

import jakarta.validation.constraints.NotBlank;

public record ValidateQrRequest(
        @NotBlank String qrCode
) {
}
