package com.example.lootvaultproject.VaultService;

import com.example.lootvaultproject.Domain.CurrencyType;
import com.example.lootvaultproject.VaultDTO.QuestResponse;
import com.example.lootvaultproject.VaultEntity.PlayerQuest;
import com.example.lootvaultproject.VaultRepository.PlayerQuestRepository;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles daily and weekly quest progression.
 */
@Service
public class QuestService {

    /**
     * Events that can progress quests.
     */
    public enum Event {
        CRATE_OPENED,
        ITEM_SOLD,
        ITEM_CRAFTED,
        DAILY_COINS_CLAIMED,
        CARD_HAND_FINISHED,
        BLACKJACK_WON,
        HOLDEM_WON
    }

    /**
     * Defines a quest type.
     *
     * @param code quest code
     * @param title display title
     * @param period DAILY or WEEKLY
     * @param event event that progresses the quest
     * @param target required progress
     * @param reward coin reward
     */
    private record Definition(
            String code,
            String title,
            String period,
            Event event,
            int target,
            long reward) {
    }

    private static final List<Definition> DEFINITIONS = List.of(
            new Definition("DAILY_COIN_CRATE", "Open your daily coin crate", "DAILY", Event.DAILY_COINS_CLAIMED, 1, 100L),
            new Definition("DAILY_CARD_HANDS_3", "Finish 3 card hands", "DAILY", Event.CARD_HAND_FINISHED, 3, 250L),
            new Definition("DAILY_BLACKJACK_WIN", "Win a Jack No Black hand", "DAILY", Event.BLACKJACK_WON, 1, 150L),
            new Definition("WEEKLY_RIVER_WINS_3", "Win 3 hands on The River", "WEEKLY", Event.HOLDEM_WON, 3, 1200L),
            new Definition("WEEKLY_CARD_HANDS_15", "Finish 15 card hands", "WEEKLY", Event.CARD_HAND_FINISHED, 15, 1000L),
            new Definition(
                    "DAILY_OPEN_3",
                    "Open 3 crates",
                    "DAILY",
                    Event.CRATE_OPENED,
                    3,
                    500L),

            new Definition(
                    "DAILY_SELL_2",
                    "Sell 2 items",
                    "DAILY",
                    Event.ITEM_SOLD,
                    2,
                    350L),

            new Definition(
                    "WEEKLY_OPEN_15",
                    "Open 15 crates",
                    "WEEKLY",
                    Event.CRATE_OPENED,
                    15,
                    3000L),

            new Definition(
                    "WEEKLY_CRAFT_3",
                    "Craft 3 items",
                    "WEEKLY",
                    Event.ITEM_CRAFTED,
                    3,
                    2500L)
    );

    private final PlayerQuestRepository repository;
    private final WalletService walletService;
    private final com.example.lootvaultproject.VaultRepository.WalletRepository wallets;
    @org.springframework.beans.factory.annotation.Value("${app.game.zone:America/New_York}")
    private String gameZone = "America/New_York";

    /**
     * Creates the quest service.
     *
     * @param repository quest repository
     * @param walletService wallet service
     */
    public QuestService(
            PlayerQuestRepository repository,
            WalletService walletService, com.example.lootvaultproject.VaultRepository.WalletRepository wallets) {

        this.repository = repository;
        this.walletService = walletService;
        this.wallets = wallets;
    }

    /**
     * Returns the player's currently active quests.
     *
     * @param playerId player identifier
     * @return active quests
     */
    @Transactional
    public List<QuestResponse> active(UUID playerId) {
        lock(playerId);
        ensure(playerId);

        return current(playerId)
                .stream()
                .map(this::response)
                .toList();
    }

    /**
     * Records a gameplay event.
     *
     * @param playerId player identifier
     * @param event gameplay event
     */
    @Transactional
    public void record(
            UUID playerId,
            Event event) {
        lock(playerId);

        ensure(playerId);

        for (PlayerQuest quest : current(playerId)) {

            Definition definition =
                    definition(quest.getQuestCode());

            if (definition.event() == event
                    && !quest.isCompleted()) {

                quest.addProgress(1);
            }
        }
    }

    /**
     * Claims a completed quest.
     *
     * @param playerId player identifier
     * @param questId quest identifier
     * @return updated quest
     */
    @Transactional
    public QuestResponse claim(
            UUID playerId,
            UUID questId) {
        lock(playerId);

        PlayerQuest quest = repository
                .findByIdAndPlayerId(
                        questId,
                        playerId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Quest not found"));

        if (!quest.isCompleted()) {
            throw new IllegalStateException(
                    "Quest is not complete");
        }

        if (quest.isClaimed()) {
            throw new IllegalStateException(
                    "Quest reward already claimed");
        }

        if (quest.getExpiresAt()
                .isBefore(OffsetDateTime.now())) {

            throw new IllegalStateException(
                    "Quest expired");
        }

        quest.claim();
        repository.save(quest);

        walletService.creditWithReason(
                playerId,
                CurrencyType.SOFT,
                quest.getRewardCoins(),
                "QUEST_REWARD",
                quest.getId());

        return response(quest);
    }

    /**
     * Ensures the player has all current daily and weekly quests.
     *
     * @param playerId player identifier
     */
    private void ensure(UUID playerId) {

        OffsetDateTime dailyStart =
                dailyStart();

        OffsetDateTime weeklyStart =
                weeklyStart();

        for (Definition definition : DEFINITIONS) {

            OffsetDateTime periodStart;

            if ("DAILY".equals(
                    definition.period())) {

                periodStart = dailyStart;

            } else {

                periodStart = weeklyStart;
            }

            boolean exists =
                    repository
                            .existsByPlayerIdAndQuestCodeAndPeriodStart(
                                    playerId,
                                    definition.code(),
                                    periodStart);

            if (!exists) {

                repository.save(
                        new PlayerQuest(
                                playerId,
                                definition.code(),
                                definition.period(),
                                definition.target(),
                                definition.reward(),
                                periodStart,
                                expiry(definition.period())));
            }
        }
    }

    /**
     * Gets quests belonging to the current daily or weekly periods.
     *
     * @param playerId player identifier
     * @return current quests
     */
    private void lock(UUID playerId) {
        wallets.findByPlayerIdWithLock(playerId).orElseThrow(() -> new IllegalArgumentException("Wallet not found"));
    }

    private List<PlayerQuest> current(
            UUID playerId) {

        OffsetDateTime now =
                OffsetDateTime.now();

        return repository
                .findByPlayerIdAndExpiresAtAfter(
                        playerId,
                        now);
    }

    /**
     * Gets the start of the current day.
     *
     * @return start of today
     */
    private OffsetDateTime dailyStart() {

        ZoneId zone =
                ZoneId.of(gameZone);

        return LocalDate.now(zone)
                .atStartOfDay(zone)
                .toOffsetDateTime();
    }

    /**
     * Gets the start of the current ISO-style week.
     *
     * Monday is considered the beginning of the week.
     *
     * @return start of current week
     */
    private OffsetDateTime weeklyStart() {

        ZoneId zone =
                ZoneId.of(gameZone);

        LocalDate monday =
                LocalDate.now(zone)
                        .with(
                                TemporalAdjusters
                                        .previousOrSame(
                                                DayOfWeek.MONDAY));

        return monday
                .atStartOfDay(zone)
                .toOffsetDateTime();
    }

    /**
     * Calculates quest expiration.
     *
     * @param period DAILY or WEEKLY
     * @return expiration timestamp
     */
    private OffsetDateTime expiry(
            String period) {

        ZoneId zone =
                ZoneId.of(gameZone);

        if ("DAILY".equals(period)) {

            return LocalDate.now(zone)
                    .plusDays(1)
                    .atStartOfDay(zone)
                    .toOffsetDateTime();
        }

        LocalDate nextMonday =
                LocalDate.now(zone)
                        .with(
                                TemporalAdjusters
                                        .next(
                                                DayOfWeek.MONDAY));

        return nextMonday
                .atStartOfDay(zone)
                .toOffsetDateTime();
    }

    /**
     * Finds a quest definition.
     *
     * @param code quest code
     * @return quest definition
     */
    private Definition definition(
            String code) {

        return DEFINITIONS
                .stream()
                .filter(definition ->
                        definition.code()
                                .equals(code))
                .findFirst()
                .orElseThrow();
    }

    /**
     * Converts a PlayerQuest entity into a response DTO.
     *
     * @param quest quest entity
     * @return quest response
     */
    private QuestResponse response(
            PlayerQuest quest) {

        Definition definition =
                definition(
                        quest.getQuestCode());

        return new QuestResponse(
                quest.getId(),
                quest.getQuestCode(),
                definition.title(),
                quest.getQuestPeriod(),
                quest.getProgress(),
                quest.getTarget(),
                quest.getRewardCoins(),
                quest.isCompleted(),
                quest.isClaimed(),
                quest.getExpiresAt());
    }
}
