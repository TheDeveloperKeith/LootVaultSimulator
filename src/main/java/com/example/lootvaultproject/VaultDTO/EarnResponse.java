package com.example.lootvaultproject.VaultDTO;

import com.example.lootvaultproject.VaultService.CardGameEngine.Card;
import java.util.List;
import java.util.UUID;

public record EarnResponse(Daily daily, Stats stats, Round round) {
    public record Daily(long coins, boolean claimed, String resetsAt) {}
    public record Stats(long handsPlayed, long wins, long netCoins, long netGems) {}
    public record Seat(String name, List<Card> cards, boolean folded, Integer total, String hand) {}
    public record Round(UUID id, String game, String stage, int version, long stake, long committed,
                        long pot, long payout, String outcome, String message, List<Card> cards,
                        List<Card> board, List<Seat> opponents, Integer total, String hand,
                        int pressure, List<String> actions, com.example.lootvaultproject.VaultService.CardGameEngine.ShowdownReveal showdown, long toCall, String currency) {}
}
