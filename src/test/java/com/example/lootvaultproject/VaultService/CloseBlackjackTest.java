package com.example.lootvaultproject.VaultService;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class CloseBlackjackTest {
    private CardGameEngine.State hand(int player, int dealer, String outcome) {
        var state=new CardGameEngine.State();state.game="BLACKJACK";state.stage="COMPLETE";state.outcome=outcome;
        state.player=List.of(new CardGameEngine.Card(10,"SPADES"),new CardGameEngine.Card(player-10,"HEARTS"));
        state.opponents=List.of(List.of(new CardGameEngine.Card(10,"CLUBS"),new CardGameEngine.Card(dealer-10,"DIAMONDS")));
        return state;
    }
    @Test void onePointWinAndLossRevealCorrectWinner() {
        var win=CardGameEngine.showdownReveal(hand(20,19,"WIN"));assertTrue(win.close());assertEquals(List.of("You"),win.winners());
        var loss=CardGameEngine.showdownReveal(hand(19,20,"LOSS"));assertTrue(loss.close());assertEquals(List.of("Dealer"),loss.winners());
    }
    @Test void blackjackVersusTwentyIsExtremelyClose() {
        var state=hand(20,20,"WIN");state.player=List.of(new CardGameEngine.Card(14,"SPADES"),new CardGameEngine.Card(13,"CLUBS"));
        assertTrue(CardGameEngine.showdownReveal(state).close());
    }
    @Test void lowerTotalsAndWideMarginsSkipCutscene() {
        assertFalse(CardGameEngine.showdownReveal(hand(19,17,"WIN")).close());
        assertFalse(CardGameEngine.showdownReveal(hand(18,19,"LOSS")).close());
    }
    @Test void bustDoesNotPretendToBeCloseEvenWhenDealerHasTwentyOne() {
        var state=hand(20,20,"LOSS");state.player=List.of(new CardGameEngine.Card(10,"SPADES"),new CardGameEngine.Card(10,"HEARTS"),new CardGameEngine.Card(2,"CLUBS"));
        assertFalse(CardGameEngine.showdownReveal(state).close());
    }
    @Test void tiedNineteensRevealSharedHonorsAndActiveHandLeaksNoResult() {
        var state=hand(19,19,"PUSH");assertEquals(List.of("You","Dealer"),CardGameEngine.showdownReveal(state).winners());
        state.stage="YOUR_TURN";assertNull(CardGameEngine.showdownReveal(state));
    }
}
