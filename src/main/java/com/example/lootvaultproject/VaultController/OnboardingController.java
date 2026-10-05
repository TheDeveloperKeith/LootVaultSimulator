package com.example.lootvaultproject.VaultController;

import java.security.Principal;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {
    private final JdbcTemplate jdbc;
    public OnboardingController(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @GetMapping
    public Map<String, Boolean> status(Principal principal) {
        Boolean completed = jdbc.queryForObject("SELECT onboarding_completed_at IS NOT NULL FROM players WHERE username=?", Boolean.class, principal.getName());
        return Map.of("completed", Boolean.TRUE.equals(completed));
    }
    @PostMapping("/complete")
    public Map<String, Boolean> complete(Principal principal) {
        jdbc.update("UPDATE players SET onboarding_completed_at=coalesce(onboarding_completed_at,now()) WHERE username=?", principal.getName());
        return Map.of("completed", true);
    }
}
