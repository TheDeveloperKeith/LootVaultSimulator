package com.example.lootvaultproject.VaultService;
import com.example.lootvaultproject.Domain.CurrencyType;
import com.example.lootvaultproject.VaultDTO.WalletResponse;
import com.example.lootvaultproject.VaultEntity.*;
import com.example.lootvaultproject.VaultRepository.*;
import org.springframework.jdbc.core.*;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.sql.ResultSet;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
class GemServiceTest {
 static <T> T proxy(Class<T> type,java.lang.reflect.InvocationHandler handler){return type.cast(Proxy.newProxyInstance(type.getClassLoader(),new Class[]{type},handler));}
 static class Fixture {
  UUID player=UUID.randomUUID();long gems=30,coins=500;int credits,debits,locks,rolls=0;double multiplier=1;boolean claimed;
  Map<UUID,String> receipts=new HashMap<>();Map<UUID,InventoryCrate> owned=new HashMap<>();
  WalletService wallet=new WalletService(null,null,null){
   @Override public void lockAccount(UUID id){assertEquals(player,id);locks++;}
   @Override public WalletResponse getMyWallet(UUID id){return new WalletResponse(null,player,coins,gems);}
   @Override public Wallet creditWithReason(UUID id,CurrencyType currency,long amount,String reason,UUID ref){assertEquals(CurrencyType.HARD,currency);credits++;gems+=amount;return null;}
   @Override public Wallet debit(UUID id,CurrencyType currency,long amount,String reason,UUID ref){assertEquals(CurrencyType.HARD,currency);if(gems<amount)throw new IllegalStateException("Insufficient gems");debits++;gems-=amount;return null;}
  };
  JdbcTemplate db=new JdbcTemplate(){
   @Override public int update(String sql,Object... args){assertTrue(locks>0,"Mutations must lock the wallet first");
    if(sql.contains("INSERT INTO daily_gem_claims")){if(claimed)return 0;claimed=true;return 1;}
    if(sql.contains("INSERT INTO gem_receipts")){receipts.put((UUID)args[1],(String)args[2]);return 1;}
    if(sql.contains("UPDATE wallets")){multiplier=((Number)args[0]).doubleValue();rolls=10;return 1;}
    throw new AssertionError(sql);
   }
   @Override public <T> List<T> query(String sql,RowMapper<T> mapper,Object... args){
    Object value;if(sql.contains("gem_receipts")){value=receipts.get(args[1]);if(value==null)return List.of();}else if(sql.contains("daily_gem_claims")){if(!claimed)return List.of();value=java.sql.Date.valueOf("2026-10-07");}else throw new AssertionError(sql);
    try{return List.of(mapper.mapRow(proxy(ResultSet.class,(p,m,a)->value),0));}catch(java.sql.SQLException e){throw new RuntimeException(e);}
   }
   @Override public <T> T queryForObject(String sql,RowMapper<T> mapper,Object... args){
    try{return mapper.mapRow(proxy(ResultSet.class,(p,m,a)->{if(m.getName().equals("getLong"))return Long.valueOf(gems);if(m.getName().equals("getDouble"))return Double.valueOf(multiplier);return Integer.valueOf(rolls);}),0);}catch(java.sql.SQLException e){throw new RuntimeException(e);}
   }
  };
  PlayerRepository players=proxy(PlayerRepository.class,(p,m,a)->Optional.of(new Player(){@Override public UUID getId(){return player;}}));
  InventoryCrateRepository crates=proxy(InventoryCrateRepository.class,(p,m,a)->{
   if(m.getName().equals("findByIdAndPlayerId"))return a[1].equals(player)?Optional.ofNullable(owned.get(a[0])):Optional.empty();
   if(m.getName().equals("delete")){owned.remove(((InventoryCrate)a[0]).getId());return null;}throw new AssertionError(m.getName());
  });
  GemService service=new GemService(db,wallet,players,crates,"America/New_York");
  UUID crate(String code){UUID id=UUID.randomUUID();owned.put(id,new InventoryCrate(player,code,"TEST"){@Override public UUID getId(){return id;}});return id;}
 }
 @Test void dailyRetryAwardsExactlyFiveOnce(){var f=new Fixture();assertEquals(35,f.service.daily("test").gems());assertEquals(35,f.service.daily("test").gems());assertEquals(1,f.credits);assertTrue(f.service.get("test").claimed());assertEquals(500,f.coins);}
 @Test void mysteryExchangeConsumesExactlyOneAndRetryDoesNotCreditAgain(){var f=new Fixture();var crate=f.crate("EXTRA_EXTRAORDINARY");var request=UUID.randomUUID();assertEquals(40,f.service.exchange("test",request,crate).gems());assertFalse(f.owned.containsKey(crate));assertEquals(40,f.service.exchange("test",request,crate).gems());assertEquals(1,f.credits);assertThrows(IllegalArgumentException.class,()->f.service.exchange("test",request,UUID.randomUUID()));}
 @Test void otherCratesAndMissingOwnershipAreRejected(){var f=new Fixture();var crate=f.crate("COMMON");assertThrows(IllegalArgumentException.class,()->f.service.exchange("test",UUID.randomUUID(),crate));assertThrows(IllegalArgumentException.class,()->f.service.exchange("test",UUID.randomUUID(),UUID.randomUUID()));assertTrue(f.owned.containsKey(crate));assertEquals(0,f.credits);}
 @Test void potionChargesOnceActivatesTenRollsAndDoesNotStack(){var f=new Fixture();var request=UUID.randomUUID();var state=f.service.potion("test",request,"ULTRA_LUCKY");assertEquals(5,state.gems());assertEquals(5.5,state.multiplier());assertEquals(10,state.rollsRemaining());assertEquals(5,f.service.potion("test",request,"ULTRA_LUCKY").gems());assertEquals(1,f.debits);assertThrows(IllegalStateException.class,()->f.service.potion("test",UUID.randomUUID(),"LUCKY"));assertThrows(IllegalArgumentException.class,()->f.service.potion("test",request,"LUCKY"));}
 @Test void insufficientFundsDoNotActivatePotion(){var f=new Fixture();f.gems=9;assertThrows(IllegalStateException.class,()->f.service.potion("test",UUID.randomUUID(),"LUCKY"));assertEquals(0,f.rolls);assertEquals(1,f.multiplier);assertEquals(0,f.debits);}
 @Test void luckyCostsTenAndLeavesCoinsUntouched(){var f=new Fixture();var state=f.service.potion("test",UUID.randomUUID(),"LUCKY");assertEquals(20,state.gems());assertEquals(2.5,state.multiplier());assertEquals(500,f.coins);}
 @Test void boostedProbabilitiesTotalOneAndDoNotBoostSecret(){for(boolean secret:new boolean[]{false,true})for(double multiplier:new double[]{1,2.5,5.5}){assertEquals(1,BannerOdds.secret(secret)+BannerOdds.featured(secret,multiplier)+BannerOdds.standard(secret,multiplier),1e-12);assertEquals(secret?.0001:0,BannerOdds.secret(secret));assertEquals(BannerOdds.featured(secret,1)*multiplier,BannerOdds.featured(secret,multiplier),1e-12);}}
 @Test void roundCurrencyDefaultsToCoinsAndGemBalanceIsSeparate(){var wallet=new Wallet(UUID.randomUUID(),500L,5L);assertEquals(CurrencyType.SOFT,EarnLootService.tableCurrency(null));assertEquals(CurrencyType.HARD,EarnLootService.tableCurrency("HARD"));assertEquals(5,EarnLootService.balance(wallet,CurrencyType.HARD));assertEquals(500,EarnLootService.balance(wallet,CurrencyType.SOFT));assertThrows(IllegalArgumentException.class,()->EarnLootService.tableCurrency("GOLD"));}
}
