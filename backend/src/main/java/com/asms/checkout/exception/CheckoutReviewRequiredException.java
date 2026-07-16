package com.asms.checkout.exception;

import com.asms.checkout.dto.CheckoutDtos.CheckoutReviewRequiredData;
import com.asms.core.exception.AppException;
import org.springframework.http.HttpStatus;

public class CheckoutReviewRequiredException extends AppException {
    private final CheckoutReviewRequiredData data;

    public CheckoutReviewRequiredException(CheckoutReviewRequiredData data) {
        super(HttpStatus.CONFLICT, "Checkout review required");
        this.data = data;
    }

    public CheckoutReviewRequiredData getData() {
        return data;
    }
}
