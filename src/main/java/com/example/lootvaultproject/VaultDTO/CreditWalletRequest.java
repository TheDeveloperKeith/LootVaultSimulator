package com.example.lootvaultproject.VaultDTO;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public class CreditWalletRequest {

    @NotNull
    @Positive
    private Long amount;

    @NotNull
    @Pattern(regexp = "SOFT|HARD", message = "currency must be SOFT or HARD")
    private String currency;

    protected CreditWalletRequest() {
        // required for JSON deserialization
    }

    public CreditWalletRequest(Long amount, String currency) {
        this.amount = amount;
        this.currency = currency;
    }

    public Long getAmount() { return amount; }
    public String getCurrency() { return currency; }
}
