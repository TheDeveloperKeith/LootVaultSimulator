package com.example.lootvaultproject.VaultController;

import com.example.lootvaultproject.VaultDTO.CollectionResponse;
import com.example.lootvaultproject.VaultDTO.PityResponse;
import com.example.lootvaultproject.VaultDTO.QuestResponse;

import com.example.lootvaultproject.VaultEntity.Player;

import com.example.lootvaultproject.VaultRepository.PlayerRepository;

import com.example.lootvaultproject.VaultService.CollectionService;
import com.example.lootvaultproject.VaultService.PityService;
import com.example.lootvaultproject.VaultService.QuestService;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/progression")
public class ProgressionController {
    private final PlayerRepository players;
    private final CollectionService collections;
    private final PityService pity;
    private final QuestService quests;

    public ProgressionController(PlayerRepository players,
                                 CollectionService collections,
                                 PityService pity,
                                 QuestService quests) {
        this.players = players;
        this.collections = collections;
        this.pity = pity;
        this.quests = quests;
    }

    @GetMapping("/collection")
    public CollectionResponse collection(Principal principal) {
        return collections.get(playerId(principal));
    }

    @GetMapping("/pity")
    public List<PityResponse> pity(Principal principal) {
        return pity.get(playerId(principal));
    }

    @GetMapping("/quests")
    public List<QuestResponse> quests(Principal principal) {
        return quests.active(playerId(principal));
    }

    @PostMapping("/quests/{questId}/claim")
    public QuestResponse claim(@PathVariable UUID questId, Principal principal) {
        return quests.claim(playerId(principal), questId);
    }

    private UUID playerId(Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("Not authenticated");
        }

        return players.findByUsername(principal.getName())
                .map(Player::getId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));
    }
}
