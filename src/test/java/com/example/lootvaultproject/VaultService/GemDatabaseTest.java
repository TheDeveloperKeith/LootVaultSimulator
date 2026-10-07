package com.example.lootvaultproject.VaultService;
import com.example.lootvaultproject.LootVaultProjectApplication;
import com.example.lootvaultproject.Domain.CurrencyType;
import com.example.lootvaultproject.VaultDTO.RegisterRequest;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
/** Opt-in PostgreSQL integration test. Use a disposable empty database only. */
@EnabledIfSystemProperty(named="gem.test.url",matches=".+")
class GemDatabaseTest {
 @org.springframework.context.annotation.Configuration
 @org.springframework.boot.autoconfigure.EnableAutoConfiguration
 @org.springframework.boot.persistence.autoconfigure.EntityScan("com.example.lootvaultproject.VaultEntity")
 @org.springframework.data.jpa.repository.config.EnableJpaRepositories("com.example.lootvaultproject.VaultRepository")
 @org.springframework.context.annotation.ComponentScan(basePackages="com.example.lootvaultproject",excludeFilters=@org.springframework.context.annotation.ComponentScan.Filter(type=org.springframework.context.annotation.FilterType.REGEX,pattern={".*Test.*",".*LootVaultProjectApplication"}))
 static class TestApp {}
 static ConfigurableApplicationContext context;
 @BeforeAll static void start() throws Exception {
  String url=System.getProperty("gem.test.url");
  // V1 and V5 both create different pity_counters layouts. Normalize the empty
  // legacy fixture only; never repair checksums or mutate application migrations.
  org.flywaydb.core.Flyway.configure().dataSource(url,"gem_test","").target("4").load().migrate();
  try(var connection=java.sql.DriverManager.getConnection(url,"gem_test","");var statement=connection.createStatement()){
   try(var columns=statement.executeQuery("SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='pity_counters' AND column_name='pool_code'")){
    columns.next();if(columns.getInt(1)==0){
     try(var rows=connection.createStatement();var count=rows.executeQuery("SELECT count(*) FROM pity_counters")){count.next();if(count.getInt(1)!=0)throw new IllegalStateException("Use an empty disposable test database.");}
     statement.execute("DROP TABLE pity_counters");
    }
   }
  }
  context=new SpringApplicationBuilder(TestApp.class).profiles("test").run(
  "--spring.config.import=optional:classpath:gem-test-missing.properties",
  "--spring.datasource.url="+System.getProperty("gem.test.url"),"--spring.datasource.username=gem_test","--spring.datasource.password=",
  "--spring.jpa.hibernate.ddl-auto=validate","--spring.jpa.show-sql=false","--server.port=0","--app.dev.enabled=false");}
 @AfterAll static void stop(){if(context!=null)context.close();}
 record Account(String username,UUID id){}
 Account account(){String name="gemtest_"+UUID.randomUUID().toString().substring(0,8);return new Account(name,context.getBean(AuthService.class).registerPlayer(new RegisterRequest(name,name+"@test.invalid","test-only-password")).getId());}
 @Test void concurrentDailyClaimsAwardFiveExactlyOnce() throws Exception {
  var a=account();var gems=context.getBean(GemService.class);
  try(var executor=Executors.newFixedThreadPool(8)){var tasks=new ArrayList<Callable<GemService.State>>();for(int i=0;i<8;i++)tasks.add(()->gems.daily(a.username));for(var result:executor.invokeAll(tasks))assertTrue(result.get().claimed());}
  assertEquals(5,gems.get(a.username).gems());
  assertEquals(1,context.getBean(JdbcTemplate.class).queryForObject("SELECT count(*) FROM ledger_entries l JOIN wallets w ON w.id=l.wallet_id WHERE w.player_id=? AND l.entry_type='DAILY_GEMS'",Integer.class,a.id));
 }
 @Test void exchangeAndPotionAndBulkPullAreAtomicAndIdempotent(){
  var a=account();var gems=context.getBean(GemService.class);var wallet=context.getBean(WalletService.class);var db=context.getBean(JdbcTemplate.class);
  wallet.creditWithReason(a.id,CurrencyType.SOFT,10000,"TEST_SETUP",null);
  var crate=context.getBean(CrateService.class).buyCrate(a.username,"EXTRA_EXTRAORDINARY");var exchange=UUID.randomUUID();
  assertEquals(10,gems.exchange(a.username,exchange,crate.getId()).gems());assertEquals(10,gems.exchange(a.username,exchange,crate.getId()).gems());
  assertEquals(0,db.queryForObject("SELECT count(*) FROM inventory_crates WHERE id=?",Integer.class,crate.getId()));
  var request=UUID.randomUUID();assertEquals(10,gems.potion(a.username,request,"LUCKY").rollsRemaining());assertEquals(0,gems.potion(a.username,request,"LUCKY").gems());
  var opening=context.getBean(OpeningService.class);var banner=opening.banners(a.username).stream().filter(OpeningService.Banner::active).findFirst().orElseThrow();
  assertEquals(2.475,banner.rewards().stream().filter(r->r.limited()&&!r.secret()).mapToDouble(OpeningService.Reward::chance).sum(),1e-9);
  assertThrows(IllegalStateException.class,()->gems.potion(a.username,UUID.randomUUID(),"ULTRA_LUCKY"));
  var pull=UUID.randomUUID();long before=wallet.getMyWallet(a.id).getSoftBalance();var rewards=opening.pull(a.username,pull,banner.code(),1);assertEquals(9,gems.get(a.username).rollsRemaining());
  var retried=opening.pull(a.username,pull,banner.code(),1);assertEquals(rewards.getFirst().id(),retried.getFirst().id());assertEquals(rewards.getFirst().itemName(),retried.getFirst().itemName());assertEquals(rewards.getFirst().acquiredAt().toInstant(),retried.getFirst().acquiredAt().toInstant());assertEquals(9,gems.get(a.username).rollsRemaining());assertEquals(before-banner.price(),wallet.getMyWallet(a.id).getSoftBalance());
  opening.pull(a.username,UUID.randomUUID(),banner.code(),10);assertEquals(0,gems.get(a.username).rollsRemaining());assertEquals(1,gems.get(a.username).multiplier());
  assertEquals(.99,opening.banners(a.username).getFirst().rewards().stream().filter(r->r.limited()&&!r.secret()).mapToDouble(OpeningService.Reward::chance).sum(),1e-9);
 }
 @Test void gemHandsSettleAndResumeWithoutTouchingCoins(){
  var a=account();var wallet=context.getBean(WalletService.class);var earn=context.getBean(EarnLootService.class);
  wallet.creditWithReason(a.id,CurrencyType.HARD,100,"TEST_SETUP",null);long coinBalance=wallet.getMyWallet(a.id).getSoftBalance();
  for(String game:List.of("BLACKJACK","HOLDEM")){
   long before=wallet.getMyWallet(a.id).getHardBalance();long stake=(before+9)/10;var request=UUID.randomUUID();var state=earn.start(a.id,request,game,stake,null,null,"HARD");
   assertEquals("HARD",state.round().currency());assertEquals(request,earn.get(a.id).round().id());assertEquals(state.round(),earn.start(a.id,request,game,stake,null,null,"HARD").round());
   assertThrows(IllegalArgumentException.class,()->earn.start(a.id,request,game,stake,null,null,"SOFT"));
   for(int i=0;i<8&&!state.round().stage().equals("COMPLETE");i++){var round=state.round();String action=game.equals("BLACKJACK")?"STAND":round.actions().contains("CALL")?"CALL":"CHECK";state=earn.act(a.id,round.id(),round.version(),action,0);}
   assertEquals("COMPLETE",state.round().stage());assertEquals(before-state.round().committed()+state.round().payout(),wallet.getMyWallet(a.id).getHardBalance());
   long settled=wallet.getMyWallet(a.id).getHardBalance();earn.act(a.id,state.round().id(),state.round().version(),"STAND",0);assertEquals(settled,wallet.getMyWallet(a.id).getHardBalance());assertEquals(coinBalance,wallet.getMyWallet(a.id).getSoftBalance());
  }
 }
 @Test void failedPotionPurchaseDoesNotActivateOrCharge(){var a=account();var gems=context.getBean(GemService.class);assertThrows(com.example.lootvaultproject.VaultException.InsufficientBalanceException.class,()->gems.potion(a.username,UUID.randomUUID(),"LUCKY"));assertEquals(0,gems.get(a.username).gems());assertEquals(0,gems.get(a.username).rollsRemaining());}
}
