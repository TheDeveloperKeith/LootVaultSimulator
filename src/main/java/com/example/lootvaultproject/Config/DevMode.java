package com.example.lootvaultproject.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import java.io.Serializable;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.Principal;
import java.util.UUID;

@Component
public class DevMode {
    public static final long TEST_BALANCE = 1_000_000L;
    private final boolean enabled;
    private final String phrase;
    public record TestIdentity(UUID playerId, String username) implements Principal, Serializable {
        @Override public String getName() { return username; }
    }
    public DevMode(@Value("${app.dev.enabled:false}") boolean enabled,
                   @Value("${app.dev.phrase:}") String phrase, Environment environment) {
        this.enabled = enabled && environment.acceptsProfiles(Profiles.of("dev"))
                && !environment.acceptsProfiles(Profiles.of("prod", "production")) && !phrase.isBlank();
        this.phrase = phrase;
    }
    public boolean enabled() { return enabled; }
    public boolean accepts(String candidate) {
        return enabled && candidate != null && MessageDigest.isEqual(phrase.getBytes(StandardCharsets.UTF_8), candidate.getBytes(StandardCharsets.UTF_8));
    }
    public boolean isTestPlayer(UUID playerId) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return enabled && auth != null && auth.isAuthenticated()
                && auth.getPrincipal() instanceof TestIdentity identity && identity.playerId().equals(playerId)
                && auth.getAuthorities().stream().anyMatch(role -> role.getAuthority().equals("ROLE_DEV"));
    }
}
