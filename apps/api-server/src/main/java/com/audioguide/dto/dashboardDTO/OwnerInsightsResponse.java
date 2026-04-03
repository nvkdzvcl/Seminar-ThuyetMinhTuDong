package com.audioguide.dto.dashboardDTO;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OwnerInsightsResponse {
    Integer shopId;
    Long totalVisits7Days;
    Long avgDailyVisits;
    Long totalAudioCompletions7Days;
    Long uniqueSessions7Days;
    Integer growthPercent;
    List<OwnerDailyMetricResponse> dailyMetrics;
    List<OwnerLanguageMetricResponse> languageMetrics;
    List<OwnerTopDishMetricResponse> topDishMetrics;
}
