package com.example.lootvaultproject.VaultService;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
class CrateOddsTest {
    @Test void crateRatesArePositiveAndTotalExactlyOneHundred() {
        for(var crate:CrateService.CRATE_DEFINITIONS.values()) {
            assertEquals(100,crate.odds().values().stream().mapToDouble(Double::doubleValue).sum(),.000001);
            assertTrue(crate.odds().values().stream().allMatch(weight->weight>0));
        }
    }
    @Test void purchasedTiersHaveAdvertisedRarityFloors() {
        assertFalse(CrateService.CRATE_DEFINITIONS.get("BASIC").odds().containsKey("COMMON"));
        for(var code:List.of("EXCELLENT","EXTRA_EXTRAORDINARY")) {
            var odds=CrateService.CRATE_DEFINITIONS.get(code).odds();assertFalse(odds.containsKey("COMMON"));assertFalse(odds.containsKey("BASIC"));
        }
    }
    @Test void higherCratesImproveChancesOfHighTierRewards() {
        double previous=0;
        for(var code:List.of("COMMON","BASIC","EXCELLENT","EXTRA_EXTRAORDINARY")) {
            var odds=CrateService.CRATE_DEFINITIONS.get(code).odds();
            double rare=List.of("EXOTIC","EXTRAORDINARY","EXTRA_EXTRAORDINARY").stream().mapToDouble(tier->odds.getOrDefault(tier,0d)).sum();
            assertTrue(rare>previous);previous=rare;
        }
        assertEquals(1,CrateService.CRATE_DEFINITIONS.get("EXCELLENT").odds().get("EXTRA_EXTRAORDINARY"));
        assertEquals(5,CrateService.CRATE_DEFINITIONS.get("EXTRA_EXTRAORDINARY").odds().get("EXTRA_EXTRAORDINARY"));
    }
}
