package com.example.lootvaultproject.VaultService;
import com.example.lootvaultproject.Config.DevMode;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import java.util.*;
import java.util.stream.Stream;
import static org.junit.jupiter.api.Assertions.*;
import org.springframework.core.env.StandardEnvironment;
class DeveloperDealTest {
    @Test void allFixturesUseUniqueCardsAndProduceRequestedHandAndResult() {
        for(var hand:List.of("FULL_HOUSE","QUADS","STRAIGHT_FLUSH")) for(var result:List.of("WIN","LOSS")) {
            var state=CardGameEngine.start("HOLDEM",100,new Random(1));CardGameEngine.testDeal(state,hand,result);
            assertEquals(switch(hand){case "FULL_HOUSE"->"Full house";case "QUADS"->"Four of a kind";default->"Straight flush";},CardGameEngine.bestHand(Stream.concat(state.player.stream(),state.board.stream()).toList()).name());
            var all=new ArrayList<>(state.deck);all.addAll(state.player);all.addAll(state.board);state.opponents.forEach(all::addAll);
            assertEquals(52,all.size());assertEquals(52,new HashSet<>(all).size());
            for(int i=0;i<3;i++) CardGameEngine.act(state,"CHECK",0,new Random(1));
            assertEquals(result,state.outcome);assertEquals(result.equals("WIN")?List.of("You"):List.of("Nova"),CardGameEngine.showdownReveal(state).winners());
        }
    }
    @Test void ordinaryAccountsCannotSupplyTestOptions() {
        var dev=new DevMode(false,"",new StandardEnvironment());
        var service=new EarnLootService(null,null,null,null,dev,500,"America/New_York");
        assertThrows(AccessDeniedException.class,()->service.start(UUID.randomUUID(),UUID.randomUUID(),"HOLDEM",100,"QUADS","WIN"));
        assertThrows(AccessDeniedException.class,()->service.start(UUID.randomUUID(),UUID.randomUUID(),"HOLDEM",100,null,"WIN"));
    }
}
