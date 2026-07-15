package com.asms.identity;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class UserAuthProviderTest {

    @Test
    void localUserDefaultsToLocalAuthProviderAndNoGoogleId() {
        Object user = newUser("Nguyen", "Van A", "user@example.com", "0909123456", "hashed-password");

        assertThat(invoke(user, "getAuthProvider").toString()).isEqualTo("LOCAL");
        assertThat(invoke(user, "getGoogleId")).isNull();
        assertThat(invoke(user, "getPasswordHash")).isEqualTo("hashed-password");
    }

    @Test
    void localLoginRejectsPasswordlessGoogleUser() throws Exception {
        Object googleUser = newUser("Nguyen", "Van A", "user@example.com", "", null);
        invoke(
                googleUser,
                "setAuthProvider",
                new Class<?>[]{classForName("com.asms.identity.enums.AuthProvider")},
                Enum.valueOf((Class<? extends Enum>) classForName("com.asms.identity.enums.AuthProvider"), "GOOGLE")
        );

        Object userRepository = Proxy.newProxyInstance(
                classForName("com.asms.identity.repository.UserRepository").getClassLoader(),
                new Class<?>[]{classForName("com.asms.identity.repository.UserRepository")},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByEmailIgnoreCase" -> Optional.of(googleUser);
                    case "toString" -> "FakeUserRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );

        Object passwordEncoder = Mockito.mock(
                classForName("org.springframework.security.crypto.password.PasswordEncoder")
        );
        Object authService = classForName("com.asms.identity.service.impl.AuthServiceImpl")
                .getConstructor(
                        classForName("com.asms.identity.repository.UserRepository"),
                        classForName("org.springframework.security.crypto.password.PasswordEncoder"),
                        classForName("com.asms.identity.security.JwtService"),
                        classForName("com.asms.identity.service.RefreshTokenService"),
                        classForName("com.asms.identity.service.RegistrationPersistenceService"),
                        classForName("com.asms.identity.service.VerificationEmailSender")
                )
                .newInstance(
                        userRepository,
                        passwordEncoder,
                        Mockito.mock(classForName("com.asms.identity.security.JwtService")),
                        Mockito.mock(classForName("com.asms.identity.service.RefreshTokenService")),
                        Mockito.mock(classForName("com.asms.identity.service.RegistrationPersistenceService")),
                        Mockito.mock(classForName("com.asms.identity.service.VerificationEmailSender"))
                );

        Object loginRequest = classForName("com.asms.identity.dto.AuthDtos$LoginRequest")
                .getDeclaredConstructor(String.class, String.class)
                .newInstance("user@example.com", "password123");

        assertThatThrownBy(() -> invoke(
                authService,
                "login",
                new Class<?>[]{classForName("com.asms.identity.dto.AuthDtos$LoginRequest")},
                loginRequest
        ))
                .isInstanceOf(InvocationTargetException.class)
                .cause()
                .hasMessage("Invalid email or password");

        verify((org.springframework.security.crypto.password.PasswordEncoder) passwordEncoder, times(1))
                .matches(eq("password123"), startsWith("$2"));
    }

    private Object newUser(
            String lastName,
            String firstMiddleName,
            String email,
            String phoneNumber,
            String passwordHash
    ) {
        try {
            Class<?> userClass = Class.forName("com.asms.identity.entity.User");
            Constructor<?> constructor = userClass.getDeclaredConstructor(
                    String.class,
                    String.class,
                    String.class,
                    String.class,
                    String.class
            );
            return constructor.newInstance(lastName, firstMiddleName, email, phoneNumber, passwordHash);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private Object invoke(Object target, String methodName) {
        try {
            Method method = target.getClass().getMethod(methodName);
            return method.invoke(target);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private Object invoke(Object target, String methodName, Class<?>[] parameterTypes, Object... values) throws Exception {
        Method method = target.getClass().getMethod(methodName, parameterTypes);
        return method.invoke(target, values);
    }

    private Class<?> classForName(String className) throws ClassNotFoundException {
        return Class.forName(className);
    }
}
