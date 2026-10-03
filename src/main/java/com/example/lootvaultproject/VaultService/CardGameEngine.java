package com.example.lootvaultproject.VaultService;

import java.util.*;
import java.util.stream.Stream;

/** Pure card rules. Hidden cards and the deck never belong in a client response. */
public final class CardGameEngine {
    private CardGameEngine() {}
    public record Card(int rank, String suit) {}
    public record Hand(long value, String name) {}
    public static class State {
        public String game;
        public String stage;
        public String outcome;
        public String message;
        public long stake;
        public long committed;
        public long pot;
        public long payout;
        public int version;
        public List<Card> deck = new ArrayList<>();
        public List<Card> player = new ArrayList<>();
        public List<Card> board = new ArrayList<>();
        public List<List<Card>> opponents = new ArrayList<>();
        public List<Boolean> folded = new ArrayList<>();
    }

    public static State start(String game, long stake, Random random) {
        if (game == null || !Set.of("BLACKJACK", "HOLDEM").contains(game)) throw new IllegalArgumentException("Choose a card mode.");
        if (stake <= 0 || stake > 1_000_000_000_000L) throw new IllegalArgumentException("Invalid stake.");
        State state = new State();
        state.game = game;
        state.stake = stake;
        state.committed = stake;
        state.pot = game.equals("HOLDEM") ? stake * 3 : stake * 2;
        for (String suit : List.of("HEARTS", "DIAMONDS", "CLUBS", "SPADES"))
            for (int rank = 2; rank <= 14; rank++) state.deck.add(new Card(rank, suit));
        Collections.shuffle(state.deck, random);
        state.player.add(draw(state)); state.player.add(draw(state));
        int opponents = game.equals("HOLDEM") ? 2 : 1;
        for (int i = 0; i < opponents; i++) {
            state.opponents.add(new ArrayList<>(List.of(draw(state), draw(state))));
            state.folded.add(false);
        }
        if (game.equals("BLACKJACK")) {
            state.stage = "YOUR_TURN";
            state.message = "Hit for another card, or stand to let the dealer play.";
            int player = blackjackTotal(state.player), dealer = blackjackTotal(state.opponents.getFirst());
            if (player == 21 || dealer == 21) {
                finish(state, player == dealer ? "PUSH" : player == 21 ? "WIN" : "LOSS",
                        player == dealer ? stake : player == 21 ? stake + stake * 3 / 2 : 0,
                        player == dealer ? "Two blackjacks. Your stake returns." : player == 21 ? "Natural blackjack! Pays 3:2." : "The dealer has blackjack.");
            }
        } else {
            burn(state);
            for (int i = 0; i < 3; i++) state.board.add(draw(state));
            state.stage = "FLOP";
            state.message = "Three cards on the table. Check, raise, or fold.";
        }
        return state;
    }

    public static void act(State state, String action, long raise, Random random) {
        if (action == null) throw new IllegalArgumentException("Choose an action.");
        if (state.stage.equals("COMPLETE")) throw new IllegalStateException("This hand is already settled.");
        if (state.game.equals("BLACKJACK")) blackjack(state, action);
        else poker(state, action, raise, random);
        state.version++;
    }

    private static void blackjack(State state, String action) {
        if (!Set.of("HIT", "STAND").contains(action)) throw new IllegalArgumentException("Choose hit or stand.");
        if (action.equals("HIT")) {
            state.player.add(draw(state));
            int total = blackjackTotal(state.player);
            if (total > 21) { finish(state, "LOSS", 0, "Bust. The dealer takes this one."); return; }
            if (total < 21) { state.message = "Your total is " + total + ". Hit or stand?"; return; }
        }
        List<Card> dealer = state.opponents.getFirst();
        while (blackjackTotal(dealer) < 17) dealer.add(draw(state));
        int playerTotal = blackjackTotal(state.player), dealerTotal = blackjackTotal(dealer);
        if (dealerTotal > 21 || playerTotal > dealerTotal) finish(state, "WIN", state.stake * 2, dealerTotal > 21 ? "Dealer busts. You win!" : "You beat the dealer!");
        else if (playerTotal == dealerTotal) finish(state, "PUSH", state.stake, "Push. Your stake returns.");
        else finish(state, "LOSS", 0, "The dealer takes this hand.");
    }

    private static void poker(State state, String action, long raise, Random random) {
        if (!Set.of("CHECK", "RAISE", "FOLD").contains(action)) throw new IllegalArgumentException("Choose check, raise, or fold.");
        if (action.equals("FOLD")) { finish(state, "LOSS", 0, "You folded. Your committed coins stay in the pot."); return; }
        if (action.equals("RAISE")) {
            if (raise <= 0 || raise > 1_000_000_000_000L) throw new IllegalArgumentException("Choose a positive raise.");
            state.committed = Math.addExact(state.committed, raise);
            state.pot = Math.addExact(state.pot, raise);
            for (int i = 0; i < 2; i++) {
                if (state.folded.get(i)) continue;
                // Decisions use only the AI's hole cards and the currently visible board.
                Hand hand = bestHand(Stream.concat(state.opponents.get(i).stream(), state.board.stream()).toList());
                boolean fold = hand.value / 759375L == 0 && random.nextDouble() < .32;
                state.folded.set(i, fold);
                if (!fold) state.pot = Math.addExact(state.pot, raise);
            }
        }
        if (state.folded.stream().allMatch(Boolean::booleanValue)) { finish(state, "WIN", state.pot, "Both opponents folded. The pot is yours."); return; }
        if (state.stage.equals("RIVER")) { showdown(state); return; }
        burn(state); state.board.add(draw(state));
        state.stage = state.board.size() == 4 ? "TURN" : "RIVER";
        state.message = state.stage.equals("TURN") ? "The turn is in. One card left to come." : "The river is in. Check to reach the showdown, or raise.";
    }

    private static void showdown(State state) {
        long player = bestHand(Stream.concat(state.player.stream(), state.board.stream()).toList()).value;
        long best = player;
        int winners = 1;
        for (int i = 0; i < 2; i++) {
            if (state.folded.get(i)) continue;
            long value = bestHand(Stream.concat(state.opponents.get(i).stream(), state.board.stream()).toList()).value;
            if (value > best) { best = value; winners = 1; }
            else if (value == best) winners++;
        }
        if (player < best) finish(state, "LOSS", 0, "An opponent has the stronger hand.");
        else finish(state, winners == 1 ? "WIN" : "SPLIT", state.pot / winners + state.pot % winners,
                winners == 1 ? "Best hand at the table. You take the pot!" : "Shared best hand. The pot is split; odd coins go to you.");
    }

    public static int blackjackTotal(List<Card> cards) {
        int total = 0, aces = 0;
        for (Card card : cards) { if (card.rank == 14) { total += 11; aces++; } else total += Math.min(10, card.rank); }
        while (total > 21 && aces-- > 0) total -= 10;
        return total;
    }

    public static Hand bestHand(List<Card> cards) {
        if (cards.size() < 5 || cards.size() > 7) throw new IllegalArgumentException("Poker needs five to seven cards.");
        Hand best = new Hand(-1, "");
        for (int a = 0; a < cards.size()-4; a++) for (int b=a+1;b<cards.size()-3;b++)
            for (int c=b+1;c<cards.size()-2;c++) for (int d=c+1;d<cards.size()-1;d++) for (int e=d+1;e<cards.size();e++) {
                Hand hand = five(List.of(cards.get(a),cards.get(b),cards.get(c),cards.get(d),cards.get(e)));
                if (hand.value > best.value) best = hand;
            }
        return best;
    }

    private static Hand five(List<Card> cards) {
        int[] counts = new int[15];
        cards.forEach(card -> counts[card.rank]++);
        List<Integer> ranks = cards.stream().map(Card::rank).sorted(Comparator.reverseOrder()).toList();
        boolean flush = cards.stream().map(Card::suit).distinct().count() == 1;
        int straight = 0;
        for (int high = 14; high >= 5; high--) {
            boolean found = true;
            for (int offset=0; offset<5; offset++) if (counts[high-offset == 1 ? 14 : high-offset] == 0) found=false;
            if (found) { straight=high; break; }
        }
        List<Integer> groups = new ArrayList<>();
        for (int rank=14;rank>=2;rank--) if(counts[rank]>0) groups.add(rank);
        groups.sort(Comparator.<Integer>comparingInt(rank->counts[rank]).reversed().thenComparing(Comparator.reverseOrder()));
        int first=groups.getFirst();
        if (flush && straight>0) return score(8,"Straight flush",List.of(straight));
        if (counts[first]==4) return score(7,"Four of a kind",groups);
        if (counts[first]==3 && counts[groups.get(1)]==2) return score(6,"Full house",groups);
        if (flush) return score(5,"Flush",ranks);
        if (straight>0) return score(4,"Straight",List.of(straight));
        if (counts[first]==3) return score(3,"Three of a kind",groups);
        if (counts[first]==2 && counts[groups.get(1)]==2) return score(2,"Two pair",groups);
        if (counts[first]==2) return score(1,"One pair",groups);
        return score(0,"High card",ranks);
    }
    private static Hand score(int category, String name, List<Integer> ranks) {
        long value=category;
        for(int i=0;i<5;i++) value=value*15+(i<ranks.size()?ranks.get(i):0);
        return new Hand(value,name);
    }
    private static Card draw(State state) { return state.deck.removeLast(); }
    private static void burn(State state) { draw(state); }
    private static void finish(State state, String outcome, long payout, String message) {
        state.stage="COMPLETE"; state.outcome=outcome; state.payout=payout; state.message=message;
    }
}
