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
@Table(name = "poi_moderation_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PoiModerationLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    @ManyToOne
    @JoinColumn(name = "poi_id", nullable = false)
    Poi poi;

    Integer menuItemId;

    @Column(nullable = false, length = 100)
    String fieldName;

    @Column(columnDefinition = "TEXT")
    String textSnapshot;

    Integer riskScore;

    @Column(length = 255)
    String labels;

    @Column(length = 255)
    String matchedTerms;

    @Column(columnDefinition = "TEXT")
    String suggestedRewrite;

    @Column(length = 100)
    String modelVersion;

    @Column(length = 20)
    String status;

    String reviewedBy;

    LocalDateTime reviewedAt;

    LocalDateTime createdAt;
}
