package com.example.lootvaultproject.VaultDTO;

public record PityResponse(
        String poolCode,
        int current,
        int guaranteeAt,
        long totalPulls) {
}
