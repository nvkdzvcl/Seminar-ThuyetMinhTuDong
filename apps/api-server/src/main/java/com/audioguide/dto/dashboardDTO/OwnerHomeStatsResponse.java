package com.audioguide.dto.dashboardDTO;

import java.util.List;
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
public class OwnerHomeStatsResponse {
    Integer shopId;
    Long qrScansToday;
    Long audioPlaysToday;
    String topLanguage;
    String topDish;
    List<OwnerRecentActivityResponse> recentActivities;
}
