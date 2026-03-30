package com.audioguide.controller;

import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.dashboardDTO.OwnerHomeStatsResponse;
import com.audioguide.dto.dashboardDTO.OwnerInsightsResponse;
import com.audioguide.dto.dashboardDTO.WeeklyVisitsResponse;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.service.DashboardService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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

    @GetMapping("/owner-insights")
    @PreAuthorize("hasAnyAuthority('OWNER_SHOP','ADMIN','SUPER_ADMIN')")
    ApiResponse<OwnerInsightsResponse> getOwnerInsights(Authentication authentication) {
        return ApiResponse.<OwnerInsightsResponse>builder()
                .message("Get owner insights successfully")
                .result(dashboardService.getOwnerInsights(resolveAuthenticatedUserId(authentication)))
                .build();
    }

    @GetMapping("/owner-home")
    @PreAuthorize("hasAnyAuthority('OWNER_SHOP','ADMIN','SUPER_ADMIN')")
    ApiResponse<OwnerHomeStatsResponse> getOwnerHomeStats(Authentication authentication) {
        return ApiResponse.<OwnerHomeStatsResponse>builder()
                .message("Get owner home stats successfully")
                .result(dashboardService.getOwnerHomeStats(resolveAuthenticatedUserId(authentication)))
                .build();
    }

    private Integer resolveAuthenticatedUserId(Authentication authentication) {
        try {
            return Integer.parseInt(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }
}
