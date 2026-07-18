package com.asms.identity.service;

import com.asms.identity.dto.AuthDtos.AuthSession;
import com.asms.identity.dto.AuthDtos.OAuthCompleteRequest;
import com.asms.identity.dto.SessionDtos.ClientContext;

public interface OAuthOnboardingService {
    String storeOnboardingCode(String email, String givenName, String familyName, String googleId);
    AuthSession completeOnboarding(OAuthCompleteRequest request, ClientContext clientContext);
}
