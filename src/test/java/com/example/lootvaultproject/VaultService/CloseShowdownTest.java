package com.example.lootvaultproject.VaultService;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class CloseShowdownTest {
    private CardGameEngine.Card card(int rank, String suit) { return new CardGameEngine.Card(rank,suit); }
    private CardGameEngine.State river(int playerSecond, int aiSecond) {
        var state=new CardGameEngine.State(); state.game="HOLDEM";state.stage="RIVER";state.stake=100;state.committed=100;state.pot=300;
        state.board=List.of(card(2,"HEARTS"),card(5,"CLUBS"),card(7,"DIAMONDS"),card(9,"SPADES"),card(11,"HEARTS"));
        state.player=List.of(card(14,"CLUBS"),card(playerSecond,"DIAMONDS"));
        state.opponents=List.of(List.of(card(14,"SPADES"),card(aiSecond,"HEARTS")),List.of(card(3,"CLUBS"),card(4,"DIAMONDS")));
        state.folded=new ArrayList<>(List.of(false,true)); return state;
    }
    private CardGameEngine.ShowdownReveal settle(CardGameEngine.State state) { CardGameEngine.act(state,"CHECK",0,new Random(1));return CardGameEngine.showdownReveal(state); }
    @Test void narrowPlayerWinIdentifiesPlayer() {
        var reveal=settle(river(13,12));assertTrue(reveal.close());assertEquals(List.of("You"),reveal.winners());
    }
    @Test void narrowLossIdentifiesActualAiWinner() {
        var reveal=settle(river(12,13));assertTrue(reveal.close());assertEquals(List.of("Nova"),reveal.winners());
    }
    @Test void tiedResultNamesAllWinners() {
        var reveal=settle(river(12,12));assertTrue(reveal.close());assertEquals(List.of("You","Nova"),reveal.winners());
    }
    @Test void DifferentCategoriesDoNotTriggerCloseReveal() {
        var state=river(12,12);state.opponents=List.of(List.of(card(9,"CLUBS"),card(9,"HEARTS")),state.opponents.get(1));
        assertFalse(settle(state).close());
    }
    @Test void foldedAiDoesNotAffectWinnerAndActiveHandsExposeNoReveal() {
        var state=river(13,12);assertNull(CardGameEngine.showdownReveal(state));
        state.opponents=List.of(state.opponents.get(0),List.of(card(9,"CLUBS"),card(9,"HEARTS")));
        assertEquals(List.of("You"),settle(state).winners());
    }
    @Test void foldingDoesNotTriggerShowdown() {
        var state=river(13,12);CardGameEngine.act(state,"FOLD",0,new Random(1));assertNull(CardGameEngine.showdownReveal(state));
    }
    private CardGameEngine.State fullHouse() {
        var state=river(13,12);
        state.board=List.of(card(14,"HEARTS"),card(14,"DIAMONDS"),card(7,"CLUBS"),card(7,"HEARTS"),card(2,"SPADES"));
        return state;
    }
    @Test void fullHouseForcesExtremeEvenWhenResultIsNotClose() {
        var state=fullHouse();state.opponents=List.of(List.of(card(12,"SPADES"),card(10,"HEARTS")),state.opponents.get(1));
        var reveal=settle(state);assertTrue(reveal.extreme());assertFalse(reveal.close());assertEquals(List.of("You"),reveal.winners());
    }
    @Test void strongFoldedPlayerCannotWinForcedReveal() {
        var state=fullHouse();CardGameEngine.act(state,"FOLD",0,new Random(1));
        var reveal=CardGameEngine.showdownReveal(state);assertTrue(reveal.extreme());assertFalse(reveal.winners().contains("You"));
    }
    @Test void quadsTriggerExtreme() {
        var state=fullHouse();state.player=List.of(card(14,"CLUBS"),card(14,"SPADES"));assertTrue(settle(state).extreme());
    }
    @Test void straightFlushTriggersExtreme() {
        var state=river(13,12);state.player=List.of(card(14,"SPADES"),card(13,"SPADES"));
        state.board=List.of(card(12,"SPADES"),card(11,"SPADES"),card(10,"SPADES"),card(2,"HEARTS"),card(3,"CLUBS"));
        assertTrue(settle(state).extreme());
    }
}
