package com.asms.core.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
public class FrontendOriginPolicy {

    private final Set<String> allowedOrigins;

    public FrontendOriginPolicy(
            @Value("${asms.frontend.allowed-origins:${asms.frontend.base-url}}") String configuredOrigins
    ) {
        LinkedHashSet<String> normalizedOrigins = new LinkedHashSet<>();
        Arrays.stream(configuredOrigins.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(FrontendOriginPolicy::normalizeConfiguredOrigin)
                .forEach(normalizedOrigins::add);

        if (normalizedOrigins.isEmpty()) {
            throw new IllegalArgumentException("At least one frontend origin must be configured");
        }
        this.allowedOrigins = Set.copyOf(normalizedOrigins);
    }

    public boolean allows(String origin) {
        String normalizedOrigin = normalizeRequestOrigin(origin);
        return normalizedOrigin != null && allowedOrigins.contains(normalizedOrigin);
    }

    public List<String> allowedOrigins() {
        return List.copyOf(allowedOrigins);
    }

    private static String normalizeConfiguredOrigin(String value) {
        String normalized = normalizeRequestOrigin(value);
        if (normalized == null) {
            throw new IllegalArgumentException("Invalid frontend origin: " + value);
        }
        return normalized;
    }

    private static String normalizeRequestOrigin(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            URI uri = URI.create(value.trim());
            if (uri.getScheme() == null || uri.getHost() == null || uri.getUserInfo() != null
                    || uri.getQuery() != null || uri.getFragment() != null
                    || (uri.getPath() != null && !uri.getPath().isBlank() && !"/".equals(uri.getPath()))) {
                return null;
            }
            String port = uri.getPort() == -1 ? "" : ":" + uri.getPort();
            return uri.getScheme().toLowerCase() + "://" + uri.getHost().toLowerCase() + port;
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }
}
