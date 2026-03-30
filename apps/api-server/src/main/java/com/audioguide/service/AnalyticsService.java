package com.audioguide.service;

import com.audioguide.dto.analyticsDTO.AnalyticsEventTrackRequest;
import com.audioguide.dto.analyticsDTO.AnalyticsEventTrackResponse;
import com.audioguide.entity.AnalyticsEvent;
import com.audioguide.enums.AnalyticsEventSource;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.repository.AnalyticsEventRepository;
import com.audioguide.repository.ShopRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AnalyticsService {
    AnalyticsEventRepository analyticsEventRepository;
    ShopRepository shopRepository;
    ObjectMapper objectMapper;

    public AnalyticsEventTrackResponse trackEvent(AnalyticsEventTrackRequest request, Authentication authentication) {
        if (!shopRepository.existsById(request.getShopId())) {
            throw new AppException(ErrorCode.SHOP_NOT_FOUND);
        }

        String normalizedEventId = normalizeEventId(request.getEventId());
        if (analyticsEventRepository.existsByEventId(normalizedEventId)) {
            return AnalyticsEventTrackResponse.builder()
                    .eventId(normalizedEventId)
                    .accepted(false)
                    .duplicate(true)
                    .build();
        }

        Integer customerId = resolveAuthenticatedUserId(authentication);
        AnalyticsEvent event = AnalyticsEvent.builder()
                .eventId(normalizedEventId)
                .shopId(request.getShopId())
                .poiId(request.getPoiId())
                .dishId(request.getDishId())
                .customerId(customerId)
                .sessionId(normalizeSessionId(request.getSessionId()))
                .eventType(request.getEventType())
                .languageCode(normalizeLanguageCode(request.getLanguageCode()))
                .source(request.getSource() == null ? AnalyticsEventSource.CUSTOMER_WEB : request.getSource())
                .occurredAt(LocalDateTime.now())
                .metadataJson(serializeMetadata(request.getMetadata()))
                .build();

        analyticsEventRepository.save(event);

        return AnalyticsEventTrackResponse.builder()
                .eventId(normalizedEventId)
                .accepted(true)
                .duplicate(false)
                .build();
    }

    private String normalizeEventId(String rawEventId) {
        if (rawEventId == null || rawEventId.isBlank()) {
            return UUID.randomUUID().toString();
        }
        String trimmed = rawEventId.trim();
        if (trimmed.length() <= 64) {
            return trimmed;
        }
        return trimmed.substring(0, 64);
    }

    private String normalizeSessionId(String rawSessionId) {
        if (rawSessionId == null || rawSessionId.isBlank()) {
            return "anon-" + UUID.randomUUID();
        }
        String trimmed = rawSessionId.trim();
        if (trimmed.length() <= 64) {
            return trimmed;
        }
        return trimmed.substring(0, 64);
    }

    private String normalizeLanguageCode(String rawLanguageCode) {
        if (rawLanguageCode == null || rawLanguageCode.isBlank()) {
            return null;
        }

        String normalized = rawLanguageCode.trim().replace('_', '-');
        if (normalized.length() <= 16) {
            return normalized;
        }
        return normalized.substring(0, 16);
    }

    private Integer resolveAuthenticatedUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        String principalName = authentication.getName();
        if (principalName == null || principalName.isBlank() || "anonymousUser".equalsIgnoreCase(principalName)) {
            return null;
        }

        try {
            return Integer.parseInt(principalName);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String serializeMetadata(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException exception) {
            return null;
        }
    }
}
