package com.example.lootvaultproject.VaultService;
import com.example.lootvaultproject.VaultEntity.ItemCatalog;
import com.example.lootvaultproject.VaultRepository.ItemCatalogRepository;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
class ContainerContentsTest {
 @Test void contentsMatchRarityFloorsAndShareProbabilityAcrossItems() {
  Map<String,List<ItemCatalog>> pools=new HashMap<>();
  for(var rarity: List.of("COMMON","BASIC","EXCELLENT","EXOTIC","EXTRAORDINARY","EXTRA_EXTRAORDINARY")){
   pools.put(rarity,List.of(new ItemCatalog(),new ItemCatalog()));
  }
  var catalog=(ItemCatalogRepository)Proxy.newProxyInstance(ItemCatalogRepository.class.getClassLoader(),new Class<?>[]{ItemCatalogRepository.class},(proxy,method,args)->pools.get(args[0]));
  var service=new CrateService(null,null,catalog,null,null,null,null);
  for(var definition:CrateService.CRATE_DEFINITIONS.values()){
   var contents=service.getContents(definition.code());
   assertEquals(100,contents.stream().mapToDouble(CrateService.ContainerItem::chance).sum(),.00001);
   assertEquals(definition.odds().size()*2,contents.size());
   for(var item:contents)assertEquals(definition.odds().get(item.rarity())/2,item.chance(),.00001);
  }
  assertThrows(IllegalArgumentException.class,()->service.getContents("INVALID"));
 }
}
