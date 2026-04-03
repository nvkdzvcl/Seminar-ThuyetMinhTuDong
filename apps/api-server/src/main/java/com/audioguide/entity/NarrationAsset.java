package com.audioguide.entity;

import com.audioguide.enums.NarrationEntityType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "narration_asset",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_narration_asset_entity_language",
                        columnNames = {"entity_type", "entity_id", "language_key"}
                )
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NarrationAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 20)
    NarrationEntityType entityType;

    @Column(name = "entity_id", nullable = false)
    Integer entityId;

    @Column(name = "language_key", nullable = false, length = 40)
    String languageKey;

    @Column(name = "effective_language_tag", nullable = false, length = 60)
    String effectiveLanguageTag;

    @Column(name = "voice_name", nullable = false, length = 120)
    String voiceName;

    @Column(name = "source_text", columnDefinition = "TEXT")
    String sourceText;

    @Column(name = "script_text", columnDefinition = "TEXT")
    String scriptText;

    @Column(name = "audio_url", nullable = false, length = 600)
    String audioUrl;

    @Column(name = "source_hash", nullable = false, length = 64)
    String sourceHash;

    @Column(name = "fallback_applied", nullable = false)
    boolean fallbackApplied;

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;
}

