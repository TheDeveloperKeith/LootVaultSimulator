package com.example.lootvaultproject.VaultService;
import com.example.lootvaultproject.VaultDTO.InventoryItemResponse;
import com.example.lootvaultproject.VaultEntity.ItemCatalog;
import com.example.lootvaultproject.VaultRepository.ItemCatalogRepository;
import com.example.lootvaultproject.VaultRepository.PlayerRepository;
import com.example.lootvaultproject.VaultEntity.Player;
import com.example.lootvaultproject.VaultEntity.InventoryItem;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import java.util.*;
import java.lang.reflect.Proxy;
import java.time.OffsetDateTime;
import java.math.BigDecimal;
import tools.jackson.databind.json.JsonMapper;
import static org.junit.jupiter.api.Assertions.*;
class OpeningServiceTest {
 @Test void bannerRejectsCountsOtherThanOneOrTen(){
  var service=new OpeningService(null,null,null,null,null,null,null,null);
  for(int count:new int[]{-1,0,2,5,9,11}) assertThrows(IllegalArgumentException.class,()->service.pull("test",UUID.randomUUID(),"SKYBOUND",count));
 }
 @Test void bulkRequiresOneToTenDistinctOwnedIds(){
  var id=UUID.randomUUID();assertDoesNotThrow(()->OpeningService.validateIds(List.of(id)));
  assertDoesNotThrow(()->OpeningService.validateIds(java.util.stream.IntStream.range(0,10).mapToObj(i->UUID.randomUUID()).toList()));
  assertThrows(IllegalArgumentException.class,()->OpeningService.validateIds(null));
  assertThrows(IllegalArgumentException.class,()->OpeningService.validateIds(List.of()));
  assertThrows(IllegalArgumentException.class,()->OpeningService.validateIds(List.of(id,id)));
  assertThrows(IllegalArgumentException.class,()->OpeningService.validateIds(Arrays.asList(id,null)));
  assertThrows(IllegalArgumentException.class,()->OpeningService.validateIds(java.util.stream.IntStream.range(0,11).mapToObj(i->UUID.randomUUID()).toList()));
 }
 @Test void rewardPoolHasExactlyOnePercentLimitedAndNinetyNineStandard(){
  var repository=(ItemCatalogRepository)Proxy.newProxyInstance(ItemCatalogRepository.class.getClassLoader(),new Class<?>[]{ItemCatalogRepository.class},(proxy,method,args)->switch(method.getName()){
   case "findByLimitedTrueAndLimitedBannerCode" -> List.of(new ItemCatalog(),new ItemCatalog(),new ItemCatalog());
   case "findByRarityAndLimitedFalse" -> List.of(new ItemCatalog(),new ItemCatalog());
   default -> throw new AssertionError("Unexpected catalog query: "+method.getName());
  });
  var service=new OpeningService(null,null,repository,null,null,null,null,null);var pool=service.rewardPool("SKYBOUND");
  assertEquals(1,pool.stream().filter(OpeningService.Reward::limited).mapToDouble(OpeningService.Reward::chance).sum(),.000001);
  assertEquals(99,pool.stream().filter(reward->!reward.limited()).mapToDouble(OpeningService.Reward::chance).sum(),.000001);
  assertEquals(3,pool.stream().filter(OpeningService.Reward::limited).count());
 }
 @Test void secretOddsAndIdentityAreHiddenWhileFeaturedOddsRemainAccurate(){
  var secret=new ItemCatalog(){@Override public boolean isSecret(){return true;} @Override public String getName(){return "Eclipse of Tomorrow";}};
  var repository=(ItemCatalogRepository)Proxy.newProxyInstance(ItemCatalogRepository.class.getClassLoader(),new Class<?>[]{ItemCatalogRepository.class},(proxy,method,args)->switch(method.getName()){
   case "findByLimitedTrueAndLimitedBannerCode" -> List.of(new ItemCatalog(),new ItemCatalog(),new ItemCatalog(),secret);
   case "findByRarityAndLimitedFalse" -> List.of(new ItemCatalog());
   default -> throw new AssertionError(method.getName());
  });
  var pool=new OpeningService(null,null,repository,null,null,null,null,null).rewardPool("SKYBOUND");
  var hidden=pool.stream().filter(OpeningService.Reward::secret).findFirst().orElseThrow();
  assertNull(hidden.chance());assertEquals("Secret relic",hidden.name());
  assertEquals(.99,pool.stream().filter(r->r.limited()&&!r.secret()).mapToDouble(OpeningService.Reward::chance).sum(),.000001);
  assertEquals(99,pool.stream().filter(r->!r.limited()).mapToDouble(OpeningService.Reward::chance).sum(),.000001);
 }
 @Test void receiptPreservesRewardsAndDatesForRetry(){
  var reward=new InventoryItemResponse(UUID.randomUUID(),"Stormheart Katana","EXTRA_EXTRAORDINARY",new BigDecimal("0.00333"),"BANNER_PULL",OffsetDateTime.parse("2026-10-05T12:00:00Z"));
  var mapper=JsonMapper.builder().build();var saved=mapper.writeValueAsString(List.of(reward));
  assertEquals(reward,mapper.readValue(saved,InventoryItemResponse[].class)[0]);
 }
 @Test void retryReturnsSavedRewardsWithoutOpeningAgain() {
  var playerId=UUID.randomUUID();var player=new Player(){@Override public UUID getId(){return playerId;}};
  var players=(PlayerRepository)Proxy.newProxyInstance(PlayerRepository.class.getClassLoader(),new Class<?>[]{PlayerRepository.class},(proxy,method,args)->Optional.of(player));
  var opens=new AtomicInteger();
  var crates=new CrateService(null,null,null,null,null,null,null){@Override public InventoryItem openCrate(String username,UUID id){opens.incrementAndGet();return new InventoryItem(playerId,new ItemCatalog(),"CRATE_OPEN");}};
  var wallet=new WalletService(null,null,null){@Override public void lockAccount(UUID id){assertEquals(playerId,id);}};
  var db=new JdbcTemplate(){
   final Map<UUID,String[]> receipts=new HashMap<>();
   @Override public int update(String sql,Object... args){receipts.put((UUID)args[1],new String[]{(String)args[2],(String)args[3]});return 1;}
   @Override public <T> List<T> query(String sql,RowMapper<T> mapper,Object... args){var saved=receipts.get(args[1]);if(saved==null)return List.of();var rs=(ResultSet)Proxy.newProxyInstance(ResultSet.class.getClassLoader(),new Class<?>[]{ResultSet.class},(proxy,method,values)->saved[(Integer)values[0]-1]);try{return List.of(mapper.mapRow(rs,0));}catch(java.sql.SQLException error){throw new RuntimeException(error);}}
  };
  var service=new OpeningService(crates,players,null,null,wallet,null,null,db);var request=UUID.randomUUID();var ids=List.of(UUID.randomUUID(),UUID.randomUUID());
  var first=service.bulk("tester",request,ids);assertEquals(first,service.bulk("tester",request,ids));assertEquals(2,opens.get());
  assertThrows(IllegalArgumentException.class,()->service.bulk("tester",request,List.of(UUID.randomUUID())));assertEquals(2,opens.get());
 }

}
