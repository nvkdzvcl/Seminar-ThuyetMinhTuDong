package com.audioguide.dto.adminDTO;

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
public class AdminDashboardSummaryResponse {
    long totalUsers;
    long activeUsers;
    long totalShops;
    long totalPois;
    long flaggedPois;
    long pendingPois;
    long totalOrders;
    long totalJobs;
    long failedJobs;
}
