package com.audioguide.controller;

import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.tourPlanDTO.TourPlanCreationRequest;
import com.audioguide.dto.tourPlanDTO.TourPlanResponse;
import com.audioguide.enums.Status;
import com.audioguide.service.TourPlanService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping("/tour-plan")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TourPlanController {

    TourPlanService tourPlanService;

    @PostMapping("/generate")
    public ApiResponse<TourPlanResponse> generateTourPlan(@RequestBody @Valid TourPlanCreationRequest request) {
        return ApiResponse.<TourPlanResponse>builder()
                .message("Tour plan generated successfully")
                .result(tourPlanService.createSuggestedTourPlan(request))
                .build();
    }

    @GetMapping("/{tourPlanId}")
    public ApiResponse<TourPlanResponse> getTourPlanById(@PathVariable Integer tourPlanId) {
        return ApiResponse.<TourPlanResponse>builder()
                .message("Tour plan retrieved successfully")
                .result(tourPlanService.getTourPlanById(tourPlanId))
                .build();
    }

    @GetMapping
    public ApiResponse<PagingDto<TourPlanResponse>> getAllTourPlans(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Status status
    ) {
        return ApiResponse.<PagingDto<TourPlanResponse>>builder()
                .message("Tour plans retrieved successfully")
                .result(tourPlanService.getAllTourPlans(page, size, status))
                .build();
    }

    @DeleteMapping("/{tourPlanId}")
    public ApiResponse<Void> deleteTourPlan(@PathVariable Integer tourPlanId) {
        tourPlanService.deleteTourPlan(tourPlanId);
        return ApiResponse.<Void>builder()
                .message("Tour plan deleted successfully")
                .build();
    }
}
