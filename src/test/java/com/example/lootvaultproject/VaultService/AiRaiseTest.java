package com.example.lootvaultproject.VaultService;
import org.junit.jupiter.api.Test;
import java.util.Random;
import static org.junit.jupiter.api.Assertions.*;
class AiRaiseTest {
    private Random raiseAlways(){return new Random(1){@Override public double nextDouble(){return 0;}};}
    @Test void aiRaiseHoldsStreetUntilCallAndAccountsForPot() {
        var s=CardGameEngine.start("HOLDEM",100,new Random(42));
        CardGameEngine.act(s,"CHECK",0,raiseAlways(),1000);
        assertEquals("FLOP",s.stage);assertEquals(20,s.toCall);assertEquals(340,s.pot);assertEquals(100,s.committed);
        assertThrows(IllegalArgumentException.class,()->CardGameEngine.act(s,"CHECK",0,raiseAlways(),1000));
        CardGameEngine.act(s,"CALL",0,raiseAlways(),1000);
        assertEquals("TURN",s.stage);assertEquals(0,s.toCall);assertEquals(120,s.committed);assertEquals(360,s.pot);
    }
    @Test void callsAreCappedAndFoldDoesNotChargePlayer() {
        var s=CardGameEngine.start("HOLDEM",100,new Random(42));CardGameEngine.act(s,"CHECK",0,raiseAlways(),7);
        assertEquals(7,s.toCall);assertThrows(IllegalArgumentException.class,()->CardGameEngine.act(s,"CALL",0,raiseAlways(),6));
        CardGameEngine.act(s,"FOLD",0,raiseAlways(),7);assertEquals("LOSS",s.outcome);assertEquals(100,s.committed);
    }
    @Test void allInPlayersAndDeveloperFixturesReceiveNoAiRaises() {
        var s=CardGameEngine.start("HOLDEM",100,new Random(42));CardGameEngine.act(s,"CHECK",0,raiseAlways(),0);assertEquals("TURN",s.stage);
        s=CardGameEngine.start("HOLDEM",100,new Random(42));CardGameEngine.testDeal(s,"QUADS","WIN");CardGameEngine.act(s,"CHECK",0,raiseAlways(),1000);assertEquals("TURN",s.stage);
    }
}
