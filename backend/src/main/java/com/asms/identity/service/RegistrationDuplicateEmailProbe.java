package com.asms.identity.service;

import com.asms.identity.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegistrationDuplicateEmailProbe {

    private final UserRepository userRepository;

    public RegistrationDuplicateEmailProbe(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public boolean existsInNewTransaction(String normalizedEmail) {
        return userRepository.existsByEmailIgnoreCase(normalizedEmail);
    }
}
