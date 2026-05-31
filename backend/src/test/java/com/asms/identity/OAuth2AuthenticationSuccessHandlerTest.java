package com.asms.identity;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class OAuth2AuthenticationSuccessHandlerTest {

    @Test
    void createsNewGoogleUserWhenEmailDoesNotExist() throws Exception {
        FakeUserRepository fakeUserRepository = new FakeUserRepository();
        Object successHandler = newSuccessHandler(fakeUserRepository.proxy(), newJwtService());

        HttpServletResponse response = Mockito.mock(HttpServletResponse.class);

        invoke(
                successHandler,
                "onAuthenticationSuccess",
                new Class<?>[]{HttpServletRequest.class, HttpServletResponse.class, org.springframework.security.core.Authentication.class},
                Mockito.mock(HttpServletRequest.class),
                response,
                googleAuthentication("google-123", "new@example.com", "Nguyen Van A", "Van A", "Nguyen")
        );

        assertThat(fakeUserRepository.savedUser()).isNotNull();
        assertThat(invoke(fakeUserRepository.savedUser(), "getGoogleId", new Class<?>[]{})).isEqualTo("google-123");
        assertThat(invoke(fakeUserRepository.savedUser(), "getAuthProvider", new Class<?>[]{}).toString()).isEqualTo("GOOGLE");
        Mockito.verify(response).sendRedirect(Mockito.contains("http://localhost:5173/oauth2/success?accessToken="));
        Mockito.verify(response).sendRedirect(Mockito.contains("expiresIn=86400"));
    }

    @Test
    void linksGoogleIdToExistingLocalUserWithoutBreakingLocalProvider() throws Exception {
        Object localUser = newUser("Nguyen", "Van A", "user@example.com", "0909123456", "hashed-password");
        FakeUserRepository fakeUserRepository = new FakeUserRepository();
        fakeUserRepository.addEmailUser("user@example.com", localUser);
        Object successHandler = newSuccessHandler(fakeUserRepository.proxy(), newJwtService());

        HttpServletResponse response = Mockito.mock(HttpServletResponse.class);

        invoke(
                successHandler,
                "onAuthenticationSuccess",
                new Class<?>[]{HttpServletRequest.class, HttpServletResponse.class, org.springframework.security.core.Authentication.class},
                Mockito.mock(HttpServletRequest.class),
                response,
                googleAuthentication("google-456", "user@example.com", "Nguyen Van A", null, null)
        );

        assertThat(invoke(localUser, "getGoogleId", new Class<?>[]{})).isEqualTo("google-456");
        assertThat(invoke(localUser, "getAuthProvider", new Class<?>[]{}).toString()).isEqualTo("LOCAL");
        Mockito.verify(response).sendRedirect(Mockito.contains("http://localhost:5173/oauth2/success?accessToken="));
        Mockito.verify(response).sendRedirect(Mockito.contains("expiresIn=86400"));
    }

    private Object newSuccessHandler(Object userRepository, Object jwtService) throws Exception {
        Constructor<?> constructor = classForName("com.asms.identity.security.OAuth2AuthenticationSuccessHandler")
                .getConstructor(
                        classForName("com.asms.identity.repository.UserRepository"),
                        classForName("com.asms.identity.security.JwtService"),
                        String.class
                );
        return constructor.newInstance(userRepository, jwtService, "http://localhost:5173");
    }

    private Object newJwtService() throws Exception {
        return classForName("com.asms.identity.security.JwtService")
                .getConstructor(ObjectMapper.class, String.class, long.class)
                .newInstance(new ObjectMapper(), "test-secret-for-oauth-handler", 86400000L);
    }

    private Object newUser(
            String lastName,
            String firstMiddleName,
            String email,
            String phoneNumber,
            String passwordHash
    ) throws Exception {
        return classForName("com.asms.identity.entity.User")
                .getConstructor(String.class, String.class, String.class, String.class, String.class)
                .newInstance(lastName, firstMiddleName, email, phoneNumber, passwordHash);
    }

    private Object invoke(Object target, String methodName, Class<?>[] parameterTypes, Object... args) throws Exception {
        Method method = target.getClass().getMethod(methodName, parameterTypes);
        return method.invoke(target, args);
    }

    private Class<?> classForName(String className) throws ClassNotFoundException {
        return Class.forName(className);
    }

    private final class FakeUserRepository implements InvocationHandler {

        private final Map<String, Object> usersByEmail = new HashMap<>();
        private final Map<String, Object> usersByGoogleId = new HashMap<>();
        private Object savedUser;

        Object proxy() throws Exception {
            Class<?> repositoryClass = classForName("com.asms.identity.repository.UserRepository");
            return Proxy.newProxyInstance(
                    repositoryClass.getClassLoader(),
                    new Class<?>[]{repositoryClass},
                    this
            );
        }

        void addEmailUser(String email, Object user) {
            usersByEmail.put(email, user);
        }

        Object savedUser() {
            return savedUser;
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            return switch (method.getName()) {
                case "findByGoogleId" -> Optional.ofNullable(usersByGoogleId.get(args[0].toString()));
                case "findByEmailIgnoreCase" -> Optional.ofNullable(usersByEmail.get(args[0].toString().toLowerCase()));
                case "save" -> {
                    savedUser = args[0];
                    Object googleId = OAuth2AuthenticationSuccessHandlerTest.this.invoke(savedUser, "getGoogleId", new Class<?>[]{});
                    Object email = OAuth2AuthenticationSuccessHandlerTest.this.invoke(savedUser, "getEmail", new Class<?>[]{});
                    if (googleId != null) {
                        usersByGoogleId.put(googleId.toString(), savedUser);
                    }
                    if (email != null) {
                        usersByEmail.put(email.toString().toLowerCase(), savedUser);
                    }
                    yield savedUser;
                }
                case "toString" -> "FakeUserRepository";
                default -> throw new UnsupportedOperationException("Unsupported repository method: " + method.getName());
            };
        }
    }

    private OAuth2AuthenticationToken googleAuthentication(
            String sub,
            String email,
            String name,
            String givenName,
            String familyName
    ) {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("sub", sub);
        attributes.put("email", email);
        attributes.put("name", name);
        if (givenName != null) {
            attributes.put("given_name", givenName);
        }
        if (familyName != null) {
            attributes.put("family_name", familyName);
        }

        DefaultOAuth2User principal = new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                "sub"
        );
        return new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");
    }
}
