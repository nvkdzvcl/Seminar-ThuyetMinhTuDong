package com.audioguide.controller;


import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.tourPlanDTO.TourPlanCreationRequest;
import com.audioguide.dto.tourPlanDTO.TourPlanResponse;
import com.audioguide.service.TourPlanService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tour-plan")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TourPlanController {

    TourPlanService tourPlanService;

    @PostMapping("/generate")
    public ApiResponse<TourPlanResponse> generateTourPlan(@RequestBody TourPlanCreationRequest request) {
        return ApiResponse.<TourPlanResponse>builder()
                .message("Tour plan generated successfully")
                .result(tourPlanService.createSuggestedTourPlan(request))
                .build();
    }

}
