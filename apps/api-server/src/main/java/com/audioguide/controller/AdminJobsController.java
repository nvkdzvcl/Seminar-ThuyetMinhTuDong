package com.audioguide.controller;

import com.audioguide.dto.adminDTO.AdminJobResponse;
import com.audioguide.dto.adminDTO.AdminJobSummaryResponse;
import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.enums.AdminJobStatus;
import com.audioguide.enums.AdminJobType;
import com.audioguide.service.AdminJobService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/jobs")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminJobsController {

    AdminJobService adminJobService;

    @GetMapping
    ApiResponse<PagingDto<AdminJobResponse>> getJobs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) AdminJobStatus status,
            @RequestParam(required = false) AdminJobType type,
            @RequestParam(required = false) String search
    ) {
        return ApiResponse.<PagingDto<AdminJobResponse>>builder()
                .message("Get admin jobs successfully")
                .result(adminJobService.getJobs(page, size, status, type, search))
                .build();
    }

    @GetMapping("/summary")
    ApiResponse<AdminJobSummaryResponse> getSummary() {
        return ApiResponse.<AdminJobSummaryResponse>builder()
                .message("Get admin jobs summary successfully")
                .result(adminJobService.getSummary())
                .build();
    }

    @GetMapping("/{id}")
    ApiResponse<AdminJobResponse> getJobById(@PathVariable Long id) {
        return ApiResponse.<AdminJobResponse>builder()
                .message("Get admin job detail successfully")
                .result(adminJobService.getJobById(id))
                .build();
    }

    @PostMapping("/{id}/retry")
    ApiResponse<AdminJobResponse> retryJob(@PathVariable Long id) {
        return ApiResponse.<AdminJobResponse>builder()
                .message("Retry admin job successfully")
                .result(adminJobService.retryJob(id))
                .build();
    }

    @PatchMapping("/{id}/cancel")
    ApiResponse<AdminJobResponse> cancelJob(@PathVariable Long id) {
        return ApiResponse.<AdminJobResponse>builder()
                .message("Cancel admin job successfully")
                .result(adminJobService.cancelJob(id))
                .build();
    }
}
