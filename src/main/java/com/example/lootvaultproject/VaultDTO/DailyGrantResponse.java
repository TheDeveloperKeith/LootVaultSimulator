package com.example.lootvaultproject.VaultDTO;

public record DailyGrantResponse(
        int boxesGranted,
        int boxesOpened,
        int boxesRemaining
) {}
