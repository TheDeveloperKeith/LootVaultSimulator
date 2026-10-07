package com.example.lootvaultproject.VaultService;
import com.example.lootvaultproject.Domain.CurrencyType;
import com.example.lootvaultproject.VaultDTO.InventoryItemResponse;
import com.example.lootvaultproject.VaultEntity.*;
import com.example.lootvaultproject.VaultRepository.*;
import java.util.*;
import java.time.OffsetDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.json.JsonMapper;
@Service
public class OpeningService {
    private final CrateService crates;
    private final PlayerRepository players;
    private final ItemCatalogRepository catalog;
    private final InventoryItemRepository inventory;
    private final WalletService wallet;
    private final CollectionService collection;
    private final QuestService quests;
    private final JdbcTemplate db;
    private final JsonMapper json=JsonMapper.builder().build();
    private final Random random=new Random();
    public OpeningService(CrateService crates,PlayerRepository players,ItemCatalogRepository catalog,InventoryItemRepository inventory,WalletService wallet,CollectionService collection,QuestService quests,JdbcTemplate db) {
        this.crates=crates;
        this.players=players;
        this.catalog=catalog;
        this.inventory=inventory;
        this.wallet=wallet;
        this.collection=collection;
        this.quests=quests;
        this.db=db;
    }
    public record Banner(String code,String title,OffsetDateTime startsAt,OffsetDateTime endsAt,long price,boolean active,List<Reward> rewards) {
    }
    public record Reward(String name,String rarity,boolean limited,Double chance,boolean secret) {
    }
    private static final Map<String,Double> STANDARD=Map.of("COMMON",59.5,"BASIC",25d,"EXCELLENT",10d,"EXOTIC",3d,"EXTRAORDINARY",1d,"EXTRA_EXTRAORDINARY",.5);
    public List<Banner> banners() {
        return db.query("SELECT * FROM limited_banners ORDER BY starts_at DESC",(rs,row)-> {
            var start=rs.getObject("starts_at",OffsetDateTime.class);
            var end=rs.getObject("ends_at",OffsetDateTime.class);
            var now=OffsetDateTime.now();
            return new Banner(rs.getString("code"),rs.getString("title"),start,end,rs.getLong("price"),!now.isBefore(start)&&now.isBefore(end),rewardPool(rs.getString("code")));
        }
        );
    }
    public List<Banner> banners(String username) {
        double multiplier=activeMultiplier(playerId(username));
        return banners().stream().map(b->new Banner(b.code(),b.title(),b.startsAt(),b.endsAt(),b.price(),b.active(),rewardPool(b.code(),multiplier))).toList();
    }
    private double activeMultiplier(UUID playerId) {
        return db.queryForObject("SELECT CASE WHEN luck_rolls>0 THEN luck_multiplier ELSE 1 END FROM wallets WHERE player_id=?",Double.class,playerId);
    }
    private double consumeLuck(UUID playerId) {
        double multiplier=activeMultiplier(playerId);
        db.update("UPDATE wallets SET luck_multiplier=CASE WHEN luck_rolls=1 THEN 1 ELSE luck_multiplier END,luck_rolls=luck_rolls-1 WHERE player_id=? AND luck_rolls>0",playerId);
        return multiplier;
    }
    List<Reward> rewardPool(String code) { return rewardPool(code,1); }
    List<Reward> rewardPool(String code,double multiplier) {
        List<Reward> result=new ArrayList<>();
        var limited=catalog.findByLimitedTrueAndLimitedBannerCode(code);
        var featured=limited.stream().filter(item->!item.isSecret()).toList();
        boolean hasSecret=limited.stream().anyMatch(ItemCatalog::isSecret);
        for(var item:featured)result.add(new Reward(item.getName(),item.getRarity(),true,BannerOdds.featured(hasSecret,multiplier)*100/featured.size(),false));
        if(hasSecret)result.add(new Reward("Secret relic","EXTRA_EXTRAORDINARY",true,null,true));
        for(var entry:STANDARD.entrySet()) {
            var pool=catalog.findByRarityAndLimitedFalse(entry.getKey());
            for(var item:pool)result.add(new Reward(item.getName(),item.getRarity(),false,entry.getValue()/99*BannerOdds.standard(hasSecret,multiplier)*100/pool.size(),false));
        }
        return result;
    }
    public static void validateIds(List<UUID> ids) {
        if(ids==null||ids.isEmpty()||ids.size()>10||ids.stream().anyMatch(Objects::isNull)||new HashSet<>(ids).size()!=ids.size())throw new IllegalArgumentException("Choose 1–10 distinct owned crates.");
    }
    @Transactional
    public List<InventoryItemResponse> bulk(String username,UUID requestId,List<UUID> ids) {
        validateIds(ids);
        return execute(username,requestId,"CRATES:"+ids.stream().sorted().toList(),()->ids.stream().map(id->response(crates.openCrate(username,id))).toList());
    }
    @Transactional
    public List<InventoryItemResponse> pull(String username,UUID requestId,String code,int count) {
        if(count!=1&&count!=10)throw new IllegalArgumentException("Choose 1 or 10 pulls.");
        return execute(username,requestId,"BANNER:"+code+":"+count,()-> {
            var banner=banners().stream().filter(b->b.code().equals(code)).findFirst().orElseThrow(()->new IllegalArgumentException("Banner not found"));
            if(!banner.active())throw new IllegalArgumentException("This banner has ended or has not started.");
            var player=playerId(username);
            wallet.debit(player,CurrencyType.SOFT,Math.multiplyExact(banner.price(),count),"BANNER_PULL",requestId);
            List<InventoryItemResponse> results=new ArrayList<>();
            for(int i=0;i<count;i++) {
                ItemCatalog item;
                double multiplier=consumeLuck(player);
                var all=catalog.findByLimitedTrueAndLimitedBannerCode(code);
                var secrets=all.stream().filter(ItemCatalog::isSecret).toList();
                var featured=all.stream().filter(candidate->!candidate.isSecret()).toList();
                double branch=random.nextDouble();
                double secretChance=BannerOdds.secret(!secrets.isEmpty());
                if(branch<secretChance+BannerOdds.featured(!secrets.isEmpty(),multiplier)) {
                    var pool=branch<secretChance ? secrets : featured;
                    if(pool.isEmpty())throw new IllegalStateException("Limited reward pool unavailable");
                    item=pool.get(random.nextInt(pool.size()));
                }
                else {
                    double roll=random.nextDouble()*99;
                    String rarity="COMMON";
                    for(var entry:STANDARD.entrySet()) {
                        roll-=entry.getValue();
                        if(roll<0) {
                            rarity=entry.getKey();
                            break;
                        }
                    }
                    var pool=catalog.findByRarityAndLimitedFalse(rarity);
                    if(pool.isEmpty())throw new IllegalStateException("Standard reward pool unavailable");
                    item=pool.get(random.nextInt(pool.size()));
                }
                var grant=inventory.save(new InventoryItem(player,item,"BANNER_PULL"));
                collection.recordDiscovery(player,item);
                quests.record(player,QuestService.Event.CRATE_OPENED);
                results.add(response(grant));
            }
            return results;
        }
        );
    }
    private UUID playerId(String username) {
        return players.findByUsername(username).orElseThrow(()->new IllegalArgumentException("Player not found")).getId();
    }
    private List<InventoryItemResponse> execute(String username,UUID request,String fingerprint,java.util.function.Supplier<List<InventoryItemResponse>> operation) {
        if(request==null)throw new IllegalArgumentException("Request ID required");
        var player=playerId(username);
        wallet.lockAccount(player);
        var receipts=db.query("SELECT fingerprint,result FROM opening_receipts WHERE player_id=? AND request_id=?",(rs,row)->new String[] {
            rs.getString(1),rs.getString(2)
        }
        ,player,request);
        if(!receipts.isEmpty()) {
            if(!receipts.getFirst()[0].equals(fingerprint))throw new IllegalArgumentException("Request ID belongs to another opening");
            return Arrays.asList(json.readValue(receipts.getFirst()[1],InventoryItemResponse[].class));
        }
        var result=operation.get();
        db.update("INSERT INTO opening_receipts(player_id,request_id,fingerprint,result) VALUES(?,?,?,?)",player,request,fingerprint,json.writeValueAsString(result));
        return result;
    }
    public static InventoryItemResponse response(InventoryItem item) {
        var c=item.getItemCatalog();
        return new InventoryItemResponse(item.getId(),c.getName(),c.getRarity(),c.getDropRate(),item.getAcquiredVia(),item.getAcquiredAt());
    }
}
