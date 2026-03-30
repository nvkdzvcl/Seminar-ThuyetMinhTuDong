package com.audioguide.controller;

import com.audioguide.dto.analyticsDTO.AnalyticsEventTrackRequest;
import com.audioguide.dto.analyticsDTO.AnalyticsEventTrackResponse;
import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.service.AnalyticsService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AnalyticsController {
    AnalyticsService analyticsService;

    @PostMapping("/events")
    ApiResponse<AnalyticsEventTrackResponse> trackEvent(
            @Valid @RequestBody AnalyticsEventTrackRequest request,
            Authentication authentication
    ) {
        return ApiResponse.<AnalyticsEventTrackResponse>builder()
                .message("Track analytics event successfully")
                .result(analyticsService.trackEvent(request, authentication))
                .build();
    }
}
