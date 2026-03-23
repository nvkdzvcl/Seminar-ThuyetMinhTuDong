package com.audioguide.controller;

import com.audioguide.dto.adminDTO.AdminDashboardSummaryResponse;
import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.dashboardDTO.WeeklyVisitsResponse;
import com.audioguide.service.AdminDashboardService;
import com.audioguide.service.DashboardService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminDashboardController {

    AdminDashboardService adminDashboardService;
    DashboardService dashboardService;

    @GetMapping("/summary")
    ApiResponse<AdminDashboardSummaryResponse> getSummary() {
        return ApiResponse.<AdminDashboardSummaryResponse>builder()
                .message("Get admin dashboard summary successfully")
                .result(adminDashboardService.getSummary())
                .build();
    }

    @GetMapping("/weekly-visits")
    ApiResponse<WeeklyVisitsResponse> getWeeklyVisits() {
        return ApiResponse.<WeeklyVisitsResponse>builder()
                .message("Get weekly visits successfully")
                .result(dashboardService.getWeeklyVisits())
                .build();
    }
}
