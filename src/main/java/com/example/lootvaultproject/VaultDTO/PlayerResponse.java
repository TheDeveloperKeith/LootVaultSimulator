package com.example.lootvaultproject.VaultDTO;

import java.util.UUID;

public record PlayerResponse(
        UUID id,
        String username,
        String email
) {}
