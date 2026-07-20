package com.asms.core.config;

import com.asms.identity.entity.User;
import com.asms.identity.enums.UserRole;
import com.asms.identity.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

@Configuration
public class DevUserSeeder {

    private static final String USER_EMAIL = "visitor@asms.test";
    private static final String STAFF_EMAIL = "staff@asms.test";
    private static final String MANAGER_EMAIL = "manager@asms.test";
    private static final String ADMIN_EMAIL = "admin@asms.test";
    private static final String PASSWORD = "Password123";

    @Bean
    CommandLineRunner seedDevUsers(DevUserSeedService devUserSeedService) {
        return args -> devUserSeedService.seed();
    }

    @Configuration
    static class DevUserSeedService {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;

        DevUserSeedService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
            this.userRepository = userRepository;
            this.passwordEncoder = passwordEncoder;
        }

        @Transactional
        public void seed() {
            userRepository.findByEmailIgnoreCase(USER_EMAIL)
                    .orElseGet(() -> userRepository.save(new User(
                            "Demo",
                            "Visitor",
                            USER_EMAIL,
                            "0900000001",
                            passwordEncoder.encode(PASSWORD)
                    )));
            seedRoleAccount(STAFF_EMAIL, "Staff", "0900000002", UserRole.STAFF);
            seedRoleAccount(MANAGER_EMAIL, "Manager", "0900000003", UserRole.MANAGER);
            seedRoleAccount(ADMIN_EMAIL, "Admin", "0900000004", UserRole.ADMIN);
        }

        private void seedRoleAccount(String email, String lastName, String phone, UserRole role) {
            userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
                User user = new User("Demo", lastName, email, phone, passwordEncoder.encode(PASSWORD));
                user.setRole(role);
                return userRepository.save(user);
            });
        }
    }
}
