package com.audioguide.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "poi_menu_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PoiMenuItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    @ManyToOne
    @JoinColumn(name = "poi_id", nullable = false)
    Poi poi;

    @Column(nullable = false)
    String name;

    @Column(columnDefinition = "TEXT")
    String descriptionText;

    Integer price;

    Double rating;

    @Column(length = 30)
    String moderationStatus;

    Boolean isSignature;

    String imageUrl;

    @Column(columnDefinition = "TEXT")
    String audioScriptText;

    Integer riskScore;

    @Column(length = 255)
    String riskFlags;

    @Column(length = 20)
    String status;

    LocalDateTime createdAt;

    LocalDateTime updatedAt;
}
