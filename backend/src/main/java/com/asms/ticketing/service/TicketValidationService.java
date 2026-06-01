package com.asms.ticketing.service;

import com.asms.identity.entity.User;
import com.asms.ticketing.dto.ValidateQrRequest;
import com.asms.ticketing.dto.ValidateQrResponse;

public interface TicketValidationService {

    ValidateQrResponse validateQr(ValidateQrRequest request, User staff);
}
