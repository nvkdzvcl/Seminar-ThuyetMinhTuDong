package com.audioguide.dto.analyticsDTO;

import com.audioguide.enums.AnalyticsEventSource;
import com.audioguide.enums.AnalyticsEventType;
import jakarta.validation.constraints.NotNull;
import java.util.Map;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnalyticsEventTrackRequest {
    String eventId;

    @NotNull
    Integer shopId;

    Integer poiId;
    Integer dishId;
    String sessionId;

    @NotNull
    AnalyticsEventType eventType;

    String languageCode;
    AnalyticsEventSource source;
    Map<String, Object> metadata;
}
