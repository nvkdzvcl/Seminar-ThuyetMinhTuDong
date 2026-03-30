package com.audioguide.entity;

import com.audioguide.enums.AnalyticsEventSource;
import com.audioguide.enums.AnalyticsEventType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "analytics_event")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnalyticsEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, unique = true, length = 64)
    String eventId;

    @Column(nullable = false)
    Integer shopId;

    Integer poiId;
    Integer dishId;
    Integer customerId;

    @Column(nullable = false, length = 64)
    String sessionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    AnalyticsEventType eventType;

    @Column(length = 16)
    String languageCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    AnalyticsEventSource source;

    @Column(nullable = false)
    LocalDateTime occurredAt;

    @Column(columnDefinition = "TEXT")
    String metadataJson;
}
