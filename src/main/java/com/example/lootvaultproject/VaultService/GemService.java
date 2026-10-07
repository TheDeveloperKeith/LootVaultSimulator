package com.example.lootvaultproject.VaultService;
import com.example.lootvaultproject.Domain.CurrencyType;
import com.example.lootvaultproject.VaultRepository.InventoryCrateRepository;
import com.example.lootvaultproject.VaultRepository.PlayerRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
@Service
public class GemService {
 private final JdbcTemplate db; private final WalletService wallet; private final PlayerRepository players;
 private final InventoryCrateRepository crates; private final ZoneId zone;
 public GemService(JdbcTemplate db,WalletService wallet,PlayerRepository players,InventoryCrateRepository crates,@Value("${app.game.zone:America/New_York}") String zone){this.db=db;this.wallet=wallet;this.players=players;this.crates=crates;this.zone=ZoneId.of(zone);}
 public record State(long gems,int dailyGems,boolean claimed,String resetsAt,double multiplier,int rollsRemaining) {}
 @Transactional(readOnly=true) public State get(String username){return state(playerId(username));}
 @Transactional public State daily(String username){
  var id=playerId(username);wallet.lockAccount(id);var today=LocalDate.now(zone);
  if(db.update("INSERT INTO daily_gem_claims(player_id,claim_date) VALUES (?,?) ON CONFLICT DO NOTHING",id,today)==1)
   wallet.creditWithReason(id,CurrencyType.HARD,5,"DAILY_GEMS",UUID.nameUUIDFromBytes((id+":"+today+":gems").getBytes(java.nio.charset.StandardCharsets.UTF_8)));
  return state(id);
 }
 @Transactional public State exchange(String username,UUID requestId,UUID crateId){
  var id=playerId(username);wallet.lockAccount(id);String fingerprint="EXCHANGE:"+crateId;
  if(repeated(id,requestId,fingerprint))return state(id);
  var crate=crates.findByIdAndPlayerId(crateId,id).orElseThrow(()->new IllegalArgumentException("This crate is no longer available. Refresh your cases."));
  if(!"EXTRA_EXTRAORDINARY".equals(crate.getCrateCode()))throw new IllegalArgumentException("Only unopened Mystery Crates can be exchanged for gems.");
  crates.delete(crate);wallet.creditWithReason(id,CurrencyType.HARD,10,"CRATE_GEMS",crateId);receipt(id,requestId,fingerprint);return state(id);
 }
 @Transactional public State potion(String username,UUID requestId,String kind){
  var id=playerId(username);wallet.lockAccount(id);String fingerprint="POTION:"+kind;
  if(repeated(id,requestId,fingerprint))return state(id);
  double multiplier;long price;
  if("LUCKY".equals(kind)){multiplier=2.5;price=10;}else if("ULTRA_LUCKY".equals(kind)){multiplier=5.5;price=25;}else throw new IllegalArgumentException("Choose a luck potion.");
  if(state(id).rollsRemaining()>0)throw new IllegalStateException("Finish your active potion's rolls before buying another.");
  wallet.debit(id,CurrencyType.HARD,price,"LUCK_POTION",requestId);
  db.update("UPDATE wallets SET luck_multiplier=?,luck_rolls=10 WHERE player_id=?",multiplier,id);
  receipt(id,requestId,fingerprint);return state(id);
 }
 private boolean repeated(UUID id,UUID request,String fingerprint){
  if(request==null)throw new IllegalArgumentException("Request ID required.");
  var saved=db.query("SELECT fingerprint FROM gem_receipts WHERE player_id=? AND request_id=?",(rs,n)->rs.getString(1),id,request);
  if(saved.isEmpty())return false;
  if(!saved.getFirst().equals(fingerprint))throw new IllegalArgumentException("Request ID belongs to another gem action.");return true;
 }
 private void receipt(UUID id,UUID request,String fingerprint){db.update("INSERT INTO gem_receipts(player_id,request_id,fingerprint) VALUES (?,?,?)",id,request,fingerprint);}
 private UUID playerId(String username){return players.findByUsername(username).orElseThrow(()->new IllegalArgumentException("Player not found.")).getId();}
 private State state(UUID id){
  var today=LocalDate.now(zone);boolean claimed=!db.query("SELECT claim_date FROM daily_gem_claims WHERE player_id=? AND claim_date=?",(rs,n)->rs.getDate(1),id,today).isEmpty();
  return db.queryForObject("SELECT hard_balance,luck_multiplier,luck_rolls FROM wallets WHERE player_id=?",(rs,n)->new State(wallet.getMyWallet(id).getHardBalance(),5,claimed,today.plusDays(1).atStartOfDay(zone).toOffsetDateTime().toString(),rs.getDouble(2),rs.getInt(3)),id);
 }
}
