package com.example.lootvaultproject.VaultDTO;

import java.util.UUID;

public record PlayerResponse(
        UUID id,
        String username,
        String email,
        boolean devMode
) {
    public PlayerResponse(UUID id, String username, String email) { this(id, username, email, false); }
}
