package com.example.lootvaultproject.VaultEntity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
        name = "daily_box_grants",
        uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "grant_date"})
)
public class DailyBoxGrant {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "player_id", nullable = false)
    private UUID playerId;

    @Column(name = "grant_date", nullable = false)
    private LocalDate grantDate;

    @Column(name = "boxes_granted", nullable = false)
    private Integer boxesGranted = 3;

    @Column(name = "boxes_opened", nullable = false)
    private Integer boxesOpened = 0;

    public DailyBoxGrant() {}

    public DailyBoxGrant(UUID playerId, LocalDate grantDate, Integer boxesGranted, Integer boxesOpened) {
        this.playerId = playerId;
        this.grantDate = grantDate;
        this.boxesGranted = boxesGranted;
        this.boxesOpened = boxesOpened;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public UUID getPlayerId() { return playerId; }
    public LocalDate getGrantDate() { return grantDate; }
    public Integer getBoxesGranted() { return boxesGranted; }
    public Integer getBoxesOpened() { return boxesOpened; }
    public void setBoxesOpened(Integer boxesOpened) { this.boxesOpened = boxesOpened; }
}