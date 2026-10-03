package com.example.lootvaultproject.VaultService;

import org.junit.jupiter.api.Test;
import java.util.*;
import tools.jackson.databind.json.JsonMapper;
import static org.junit.jupiter.api.Assertions.*;
import static com.example.lootvaultproject.VaultService.CardGameEngine.*;

class CardGameEngineTest {
    private Card c(int rank, String suit) { return new Card(rank,suit); }
    private List<Card> cards(int... ranks) { List<Card> cards=new ArrayList<>(); for(int i=0;i<ranks.length;i++) cards.add(c(ranks[i],List.of("HEARTS","CLUBS","SPADES","DIAMONDS").get(i%4))); return cards; }
    private State blackjack(List<Card> player,List<Card> dealer,List<Card> deck) {
        State s=new State(); s.game="BLACKJACK"; s.stage="YOUR_TURN"; s.stake=100; s.committed=100; s.pot=200;
        s.player=new ArrayList<>(player); s.opponents.add(new ArrayList<>(dealer)); s.folded.add(false); s.deck=new ArrayList<>(deck); return s;
    }
    @Test void acesBecomeOneWhenNeeded() { assertEquals(12,blackjackTotal(cards(14,14,10))); assertEquals(21,blackjackTotal(cards(14,5,5))); assertEquals(21,blackjackTotal(cards(14,14,9))); }
    @Test void bustSettlesWithoutDealerDrawing() {
        State s=blackjack(cards(10,9),cards(10,6),cards(8)); act(s,"HIT",0,new Random(1));
        assertEquals("LOSS",s.outcome); assertEquals(0,s.payout); assertEquals(2,s.opponents.getFirst().size());
    }
    @Test void dealerStandsOnSoftSeventeen() {
        State s=blackjack(cards(10,8),cards(14,6),cards(10)); act(s,"STAND",0,new Random(1));
        assertEquals("WIN",s.outcome); assertEquals(200,s.payout); assertEquals(2,s.opponents.getFirst().size());
    }
    @Test void equalTotalsReturnStake() { State s=blackjack(cards(10,8),cards(10,8),cards(2)); act(s,"STAND",0,new Random(1)); assertEquals("PUSH",s.outcome); assertEquals(100,s.payout); }
    @Test void dealerBustPaysTwoTimesStake() { State s=blackjack(cards(10,7),cards(10,6),cards(10)); act(s,"STAND",0,new Random(1)); assertEquals(200,s.payout); }
    @Test void hitToTwentyOneAutomaticallyFinishes() { State s=blackjack(cards(10,5),cards(10,8),cards(6)); act(s,"HIT",0,new Random(1)); assertEquals("COMPLETE",s.stage); assertEquals(200,s.payout); }
    @Test void finishedHandCannotBePlayedTwice() { State s=blackjack(cards(10,8),cards(10,8),cards(2)); act(s,"STAND",0,new Random(1)); assertThrows(IllegalStateException.class,()->act(s,"STAND",0,new Random(1))); }
    @Test void wheelIsLowestStraight() { Hand wheel=bestHand(cards(14,2,3,4,5)); Hand six=bestHand(cards(2,3,4,5,6)); assertEquals("Straight",wheel.name()); assertTrue(six.value()>wheel.value()); }
    @Test void flushBeatsStraightAndLosesToFullHouse() {
        List<Card> flush=List.of(c(14,"HEARTS"),c(11,"HEARTS"),c(9,"HEARTS"),c(6,"HEARTS"),c(2,"HEARTS"));
        assertTrue(bestHand(flush).value()>bestHand(cards(9,10,11,12,13)).value());
        assertTrue(bestHand(cards(8,8,8,3,3)).value()>bestHand(flush).value());
    }
    @Test void choosesBestFiveFromSevenAndBreaksTiesWithKickers() {
        assertEquals("Full house",bestHand(cards(14,14,14,13,13,13,2)).name());
        assertTrue(bestHand(cards(10,10,14,9,3)).value()>bestHand(cards(10,10,13,9,3)).value());
    }
    @Test void straightFlushBeatsQuads() { List<Card> royal=List.of(c(10,"SPADES"),c(11,"SPADES"),c(12,"SPADES"),c(13,"SPADES"),c(14,"SPADES")); assertEquals("Straight flush",bestHand(royal).name()); assertTrue(bestHand(royal).value()>bestHand(cards(14,14,14,14,13)).value()); }
    @Test void holdemStartsWithFlopAndUniqueDeck() {
        State s=start("HOLDEM",100,new Random(42)); assertEquals(3,s.board.size()); assertEquals(2,s.opponents.size()); assertEquals(300,s.pot);
        Set<Card> all=new HashSet<>(s.deck); all.addAll(s.player); all.addAll(s.board); s.opponents.forEach(all::addAll); assertEquals(51,all.size());
    }
    @Test void checksAdvanceTurnRiverThenShowdown() { State s=start("HOLDEM",100,new Random(42)); act(s,"CHECK",0,new Random(1)); assertEquals("TURN",s.stage); act(s,"CHECK",0,new Random(1)); assertEquals("RIVER",s.stage); act(s,"CHECK",0,new Random(1)); assertEquals("COMPLETE",s.stage); assertEquals(5,s.board.size()); assertTrue(s.payout==0 || s.payout>=100); }
    @Test void foldedHandNeverReturnsCoins() { State s=start("HOLDEM",100,new Random(42)); act(s,"FOLD",0,new Random(1)); assertEquals("LOSS",s.outcome); assertEquals(0,s.payout); assertEquals(100,s.committed); }
    @Test void splitPotReturnsEqualShare() {
        State s=start("HOLDEM",101,new Random(42)); s.board=new ArrayList<>(List.of(c(10,"HEARTS"),c(11,"HEARTS"),c(12,"HEARTS"),c(13,"HEARTS"),c(14,"HEARTS"))); s.stage="RIVER";
        act(s,"CHECK",0,new Random(1)); assertEquals("SPLIT",s.outcome); assertEquals(101,s.payout);
    }
    @Test void raisesCountOnlyCallingOpponents() { State s=start("HOLDEM",100,new Random(42)); act(s,"RAISE",50,new Random(1)); assertEquals(150,s.committed); long expected=350+s.folded.stream().filter(f->!f).count()*50; assertEquals(expected,s.pot); }
    @Test void invalidActionsAndAmountsAreRejected() { assertThrows(IllegalArgumentException.class,()->start("OTHER",100,new Random())); assertThrows(IllegalArgumentException.class,()->start("HOLDEM",0,new Random())); State s=start("HOLDEM",100,new Random(2)); assertThrows(IllegalArgumentException.class,()->act(s,"HIT",0,new Random())); assertThrows(IllegalArgumentException.class,()->act(s,"RAISE",-1,new Random())); }
    @Test void durableStateRoundTripsWithHiddenDeckIntact() { State s=start("HOLDEM",100,new Random(42)); JsonMapper mapper=JsonMapper.builder().build(); State restored=mapper.readValue(mapper.writeValueAsString(s),State.class); assertEquals(s.deck,restored.deck); assertEquals(s.player,restored.player); act(restored,"CHECK",0,new Random(1)); assertEquals("TURN",restored.stage); }
    @Test void naturalBlackjackPayoutIsThreeToTwoRoundedDown() { boolean found=false; for(int seed=0;seed<1000;seed++) { State s=start("BLACKJACK",101,new Random(seed)); if("WIN".equals(s.outcome)) { assertEquals(252,s.payout); found=true; break; } } assertTrue(found); }
}
