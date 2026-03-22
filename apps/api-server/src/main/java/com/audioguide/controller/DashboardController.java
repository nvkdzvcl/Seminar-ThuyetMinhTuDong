package com.audioguide.controller;

import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.dashboardDTO.WeeklyVisitsResponse;
import com.audioguide.service.DashboardService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DashboardController {

    DashboardService dashboardService;

    @GetMapping("/weekly-visits")
    ApiResponse<WeeklyVisitsResponse> getWeeklyVisits() {
        return ApiResponse.<WeeklyVisitsResponse>builder()
                .message("Get weekly visits successfully")
                .result(dashboardService.getWeeklyVisits())
                .build();
    }
}
