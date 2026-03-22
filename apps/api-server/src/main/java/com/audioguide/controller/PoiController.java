package com.audioguide.controller;

import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.poiDTO.PoiCreateRequest;
import com.audioguide.dto.poiDTO.PoiApprovalSummaryResponse;
import com.audioguide.dto.poiDTO.PoiResponse;
import com.audioguide.dto.poiDTO.PoiStatusUpdateRequest;
import com.audioguide.dto.poiDTO.PoiUpdateRequest;
import com.audioguide.enums.PoiStatus;
import com.audioguide.service.PoiService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/poi")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PoiController {

    PoiService poiService;

    @GetMapping
    ApiResponse<PagingDto<PoiResponse>> getAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PoiStatus status,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) Boolean hasFlag
    ) {
        return ApiResponse.<PagingDto<PoiResponse>>builder()
                .message("Get POIs successfully")
                .result(poiService.getAll(page, size, search, status, region, hasFlag))
                .build();
    }

    @GetMapping("/{id}")
    ApiResponse<PoiResponse> getById(@PathVariable Integer id) {
        return ApiResponse.<PoiResponse>builder()
                .message("Get POI successfully")
                .result(poiService.getById(id))
                .build();
    }

    @GetMapping("/shop/{shopId}/approval")
    ApiResponse<PoiApprovalSummaryResponse> getApprovalByShopId(@PathVariable Integer shopId) {
        return ApiResponse.<PoiApprovalSummaryResponse>builder()
                .message("Get POI approval summary successfully")
                .result(poiService.getApprovalSummaryByShopId(shopId))
                .build();
    }

    @PostMapping("/shop/{shopId}/submit")
    ApiResponse<PoiApprovalSummaryResponse> submitRegistration(@PathVariable Integer shopId) {
        return ApiResponse.<PoiApprovalSummaryResponse>builder()
                .message("Submit POI registration successfully")
                .result(poiService.submitRegistration(shopId))
                .build();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    ApiResponse<PoiResponse> create(@RequestBody @Valid PoiCreateRequest request) {
        return ApiResponse.<PoiResponse>builder()
                .message("POI created successfully")
                .result(poiService.create(request))
                .build();
    }

    @PutMapping("/{id}")
    ApiResponse<PoiResponse> update(@PathVariable Integer id, @RequestBody @Valid PoiUpdateRequest request) {
        return ApiResponse.<PoiResponse>builder()
                .message("POI updated successfully")
                .result(poiService.update(id, request))
                .build();
    }

    @PatchMapping("/{id}/status")
    ApiResponse<PoiResponse> updateStatus(@PathVariable Integer id, @RequestBody @Valid PoiStatusUpdateRequest request) {
        return ApiResponse.<PoiResponse>builder()
                .message("POI status updated successfully")
                .result(poiService.updateStatus(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    ApiResponse<Void> delete(@PathVariable Integer id) {
        poiService.delete(id);
        return ApiResponse.<Void>builder()
                .message("POI deleted successfully")
                .build();
    }
}
