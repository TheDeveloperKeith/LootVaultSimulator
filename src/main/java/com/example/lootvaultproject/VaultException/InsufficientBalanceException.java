package com.example.lootvaultproject.VaultException;

// Not used by credit() yet, but you'll need this the moment you write
// debit logic for gacha pulls or marketplace purchases — added now so
// the exception layer is ready before that code exists.
public class InsufficientBalanceException extends RuntimeException {
    public InsufficientBalanceException(String currency, long requested, long available) {
        super("Insufficient " + ("HARD".equals(currency)?"gem":"SOFT".equals(currency)?"coin":currency) + " balance: requested " + requested
                + " but only " + available + " available");
    }
}
