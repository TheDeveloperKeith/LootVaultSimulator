package com.example.lootvaultproject.VaultController;
import com.example.lootvaultproject.VaultService.GemService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequestMapping("/api/gems")
public class GemController {
 private final GemService service;public GemController(GemService service){this.service=service;}
 public record Exchange(UUID requestId,UUID crateId){}
 public record Potion(UUID requestId,String kind){}
 @GetMapping public GemService.State get(Authentication auth){return service.get(auth.getName());}
 @PostMapping("/daily/claim") public GemService.State daily(Authentication auth){return service.daily(auth.getName());}
 @PostMapping("/exchange") public GemService.State exchange(Authentication auth,@RequestBody Exchange body){return service.exchange(auth.getName(),body.requestId(),body.crateId());}
 @PostMapping("/potions") public GemService.State potion(Authentication auth,@RequestBody Potion body){return service.potion(auth.getName(),body.requestId(),body.kind());}
}
