package com.example.lootvaultproject.VaultService;

import com.example.lootvaultproject.Domain.CurrencyType;
import com.example.lootvaultproject.Config.DevMode;
import org.springframework.security.access.AccessDeniedException;
import com.example.lootvaultproject.VaultDTO.EarnResponse;
import com.example.lootvaultproject.VaultEntity.Wallet;
import com.example.lootvaultproject.VaultRepository.WalletRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;
import java.security.SecureRandom;
import java.time.*;
import java.util.*;
import java.util.stream.Stream;

@Service
public class EarnLootService {
    private final JdbcTemplate jdbc;
    private final WalletRepository wallets;
    private final WalletService walletService;
    private final QuestService quests;
    private final DevMode devMode;
    private final JsonMapper json = JsonMapper.builder().build();
    private final SecureRandom random = new SecureRandom();
    private final long dailyCoins;
    private final ZoneId zone;
    private record Row(UUID id, CardGameEngine.State state) {}

    public EarnLootService(JdbcTemplate jdbc, WalletRepository wallets, WalletService walletService,
                           QuestService quests, DevMode devMode, @Value("${app.earn.daily-coins:500}") long dailyCoins,
                           @Value("${app.game.zone:America/New_York}") String zone) {
        if (dailyCoins <= 0) throw new IllegalArgumentException("Daily coins must be positive.");
        this.jdbc=jdbc; this.wallets=wallets; this.walletService=walletService; this.quests=quests;
        this.devMode=devMode;
        this.dailyCoins=dailyCoins; this.zone=ZoneId.of(zone);
    }

    @Transactional(readOnly = true)
    public EarnResponse get(UUID playerId) { return response(playerId, latest(playerId)); }

    @Transactional
    public EarnResponse claimDaily(UUID playerId) {
        lockWallet(playerId);
        LocalDate today=LocalDate.now(zone);
        int inserted=jdbc.update("INSERT INTO daily_coin_claims(player_id, claim_date, amount) VALUES (?, ?, ?) ON CONFLICT DO NOTHING", playerId,today,dailyCoins);
        if(inserted==1) {
            walletService.creditWithReason(playerId,CurrencyType.SOFT,dailyCoins,"DAILY_COIN_CRATE",UUID.nameUUIDFromBytes((playerId+":"+today).getBytes(java.nio.charset.StandardCharsets.UTF_8)));
            quests.record(playerId,QuestService.Event.DAILY_COINS_CLAIMED);
        }
        return response(playerId,latest(playerId));
    }

    @Transactional
    public EarnResponse start(UUID playerId, UUID requestId, String game, long stake) {
        return start(playerId,requestId,game,stake,null,null);
    }

    @Transactional
    public EarnResponse start(UUID playerId, UUID requestId, String game, long stake, String testHand, String testResult) {
        return start(playerId,requestId,game,stake,testHand,testResult,"SOFT");
    }

    @Transactional
    public EarnResponse start(UUID playerId, UUID requestId, String game, long stake, String testHand, String testResult, String currencyName) {
        CurrencyType currency=tableCurrency(currencyName);
        if ((testHand != null || testResult != null) && !devMode.isTestPlayer(playerId)) throw new AccessDeniedException("Test deals require a developer session.");
        if (testHand != null && !"HOLDEM".equals(game)) throw new IllegalArgumentException("Test deals are for The River.");
        Wallet wallet=lockWallet(playerId);
        if(requestId==null) throw new IllegalArgumentException("A round request ID is required.");
        List<Row> repeated=jdbc.query("SELECT id, state FROM earn_rounds WHERE id=? AND player_id=?",(rs,n)->new Row(rs.getObject("id",UUID.class),read(rs.getString("state"))),requestId,playerId);
        if(!repeated.isEmpty()) {
            var saved=repeated.getFirst();
            if(!saved.state.game.equals(game)||saved.state.stake!=stake||tableCurrency(saved.state.currency)!=currency)throw new IllegalArgumentException("Request ID belongs to another hand.");
            return response(playerId,saved);
        }
        Row existing=latest(playerId);
        if(existing!=null && !existing.state.stage.equals("COMPLETE")) throw new IllegalStateException("Finish your current hand first.");
        long balance=balance(wallet,currency);
        long minimum=balance/10+(balance%10==0?0:1);
        if(balance<=0 || stake<Math.max(1,minimum) || stake>balance) throw new IllegalArgumentException("Stake between 10% and 100% of your current "+(currency==CurrencyType.HARD?"gems":"coins")+".");
        CardGameEngine.State state=CardGameEngine.start(game,stake,random);
        state.currency=currency.name();
        if (testHand != null) CardGameEngine.testDeal(state,testHand,testResult);
        walletService.debit(playerId,currency,stake,"CARD_GAME_STAKE",requestId);
        jdbc.update("INSERT INTO earn_rounds(id,player_id,game,status,state,coins_committed,currency) VALUES (?,?,?,'ACTIVE',?,?,?)",requestId,playerId,game,json.writeValueAsString(state),stake,currency.name());
        Row row=new Row(requestId,state);
        saveAndSettle(playerId,row);
        return response(playerId,row);
    }

    @Transactional
    public EarnResponse act(UUID playerId, UUID roundId, int version, String action, long raise) {
        Wallet wallet=lockWallet(playerId);
        Row row=jdbc.query("SELECT id,state FROM earn_rounds WHERE id=? AND player_id=?",(rs,n)->new Row(rs.getObject("id",UUID.class),read(rs.getString("state"))),roundId,playerId)
                .stream().findFirst().orElseThrow(()->new IllegalArgumentException("Hand not found."));
        CurrencyType currency=tableCurrency(row.state.currency);
        long availableCoins=balance(wallet,currency);
        if(row.state.stage.equals("COMPLETE")) return response(playerId,row);
        if(version!=row.state.version) throw new IllegalStateException("The hand changed. Refresh before acting again.");
        if("RAISE".equals(action) && "HOLDEM".equals(row.state.game)) {
            if(raise<=0 || raise>availableCoins) throw new IllegalArgumentException("Raise exceeds your remaining table balance.");
            walletService.debit(playerId,currency,raise,"CARD_GAME_RAISE",row.id);
        }
        if ("CALL".equals(action) && row.state.toCall > 0) {
            if(row.state.toCall>availableCoins) throw new IllegalArgumentException("Not enough table currency to call.");
            walletService.debit(playerId,currency,row.state.toCall,"CARD_GAME_CALL",row.id);
        }
        CardGameEngine.act(row.state,action,raise,random,availableCoins);
        saveAndSettle(playerId,row);
        return response(playerId,row);
    }

    private void saveAndSettle(UUID playerId, Row row) {
        boolean complete=row.state.stage.equals("COMPLETE");
        if(complete) {
            if(row.state.payout>0) walletService.creditWithReason(playerId,tableCurrency(row.state.currency),row.state.payout,"CARD_GAME_PAYOUT",row.id);
            quests.record(playerId,QuestService.Event.CARD_HAND_FINISHED);
            if("WIN".equals(row.state.outcome)) {
                quests.record(playerId,row.state.game.equals("BLACKJACK")?QuestService.Event.BLACKJACK_WON:QuestService.Event.HOLDEM_WON);
            }
        }
        jdbc.update("UPDATE earn_rounds SET state=?,status=?,coins_committed=?,payout=?,outcome=?,updated_at=now() WHERE id=?",
                json.writeValueAsString(row.state),complete?"COMPLETE":"ACTIVE",row.state.committed,row.state.payout,row.state.outcome,row.id);
    }

    static CurrencyType tableCurrency(String name) {
        if(name==null||"SOFT".equals(name))return CurrencyType.SOFT;
        if("HARD".equals(name))return CurrencyType.HARD;
        throw new IllegalArgumentException("Choose coins or gems.");
    }
    static long balance(Wallet wallet,CurrencyType currency){return currency==CurrencyType.HARD?wallet.getHardBalance():wallet.getSoftBalance();}
    private Wallet lockWallet(UUID playerId) {
        return wallets.findByPlayerIdWithLock(playerId).orElseThrow(()->new IllegalArgumentException("Wallet not found."));
    }
    private Row latest(UUID playerId) {
        return jdbc.query("SELECT id,state FROM earn_rounds WHERE player_id=? ORDER BY created_at DESC,id DESC LIMIT 1",(rs,n)->new Row(rs.getObject("id",UUID.class),read(rs.getString("state"))),playerId).stream().findFirst().orElse(null);
    }
    private CardGameEngine.State read(String state) { return json.readValue(state,CardGameEngine.State.class); }

    private EarnResponse response(UUID playerId, Row row) {
        LocalDate today=LocalDate.now(zone);
        List<Long> claim=jdbc.query("SELECT amount FROM daily_coin_claims WHERE player_id=? AND claim_date=?",(rs,n)->rs.getLong(1),playerId,today);
        EarnResponse.Daily daily=new EarnResponse.Daily(claim.isEmpty()?dailyCoins:claim.getFirst(),!claim.isEmpty(),today.plusDays(1).atStartOfDay(zone).toOffsetDateTime().toString());
        EarnResponse.Stats stats=jdbc.queryForObject("SELECT count(*),coalesce(sum(CASE WHEN outcome='WIN' THEN 1 ELSE 0 END),0),coalesce(sum(CASE WHEN currency='SOFT' THEN payout-coins_committed ELSE 0 END),0),coalesce(sum(CASE WHEN currency='HARD' THEN payout-coins_committed ELSE 0 END),0) FROM earn_rounds WHERE player_id=? AND status='COMPLETE'",
                (rs,n)->new EarnResponse.Stats(rs.getLong(1),rs.getLong(2),rs.getLong(3),rs.getLong(4)),playerId);
        if(row==null) return new EarnResponse(daily,stats,null);
        var state=row.state;
        boolean complete=state.stage.equals("COMPLETE"), blackjack=state.game.equals("BLACKJACK");
        var back=new CardGameEngine.Card(0,"BACK");
        List<EarnResponse.Seat> seats=new ArrayList<>();
        for(int i=0;i<state.opponents.size();i++) {
            List<CardGameEngine.Card> cards=state.opponents.get(i);
            List<CardGameEngine.Card> visible=complete?cards:blackjack?List.of(cards.getFirst(),back):List.of(back,back);
            String hand=complete&&!blackjack&&state.board.size()>=3?CardGameEngine.bestHand(Stream.concat(cards.stream(),state.board.stream()).toList()).name():null;
            seats.add(new EarnResponse.Seat(blackjack?"Dealer":i==0?"Nova":"Atlas",visible,state.folded.get(i),complete&&blackjack?CardGameEngine.blackjackTotal(cards):null,hand));
        }
        Integer total=blackjack?CardGameEngine.blackjackTotal(state.player):null;
        String hand=blackjack?null:CardGameEngine.bestHand(Stream.concat(state.player.stream(),state.board.stream()).toList()).name();
        int pressure=blackjack?Math.min(100,Math.max(0,(total-12)*11)):state.stage.equals("FLOP")?35:state.stage.equals("TURN")?65:90;
        if(state.toCall>0) pressure=Math.min(100,pressure+20);
        List<String> actions=complete?List.of():blackjack?List.of("HIT","STAND"):state.toCall>0?List.of("CALL","FOLD"):List.of("CHECK","RAISE","FOLD");
        return new EarnResponse(daily,stats,new EarnResponse.Round(row.id,state.game,state.stage,state.version,state.stake,state.committed,state.pot,state.payout,state.outcome,state.message,state.player,state.board,seats,total,hand,pressure,actions,CardGameEngine.showdownReveal(state),state.toCall,tableCurrency(state.currency).name()));
    }
}
