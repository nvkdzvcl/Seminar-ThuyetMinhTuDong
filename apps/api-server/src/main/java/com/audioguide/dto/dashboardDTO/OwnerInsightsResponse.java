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
    Long totalOrders7Days;
    Long totalRevenue7Days;
    Long avgDailyOrders;
    Long uniqueCustomers7Days;
    Integer growthPercent;
    List<OwnerDailyMetricResponse> dailyMetrics;
    List<OwnerLanguageMetricResponse> languageMetrics;
    List<OwnerTopDishMetricResponse> topDishMetrics;
}

