package com.audioguide.controller;

import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.poiDTO.PoiApprovalHistoryItemResponse;
import com.audioguide.dto.poiDTO.PoiCreateRequest;
import com.audioguide.dto.poiDTO.PoiResponse;
import com.audioguide.dto.poiDTO.PoiStatusUpdateRequest;
import com.audioguide.dto.poiDTO.PoiUpdateRequest;
import com.audioguide.enums.PoiStatus;
import com.audioguide.service.PoiService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/pois")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminPoiController {

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
                .message("Get admin POIs successfully")
                .result(poiService.getAll(page, size, search, status, region, hasFlag))
                .build();
    }

    @GetMapping("/{id}")
    ApiResponse<PoiResponse> getById(@PathVariable Integer id) {
        return ApiResponse.<PoiResponse>builder()
                .message("Get admin POI successfully")
                .result(poiService.getById(id))
                .build();
    }

    @GetMapping("/{id}/approval-history")
    ApiResponse<List<PoiApprovalHistoryItemResponse>> getApprovalHistory(@PathVariable Integer id) {
        return ApiResponse.<List<PoiApprovalHistoryItemResponse>>builder()
                .message("Get POI approval history successfully")
                .result(poiService.getApprovalHistoryByPoiId(id))
                .build();
    }

    @PostMapping
    ApiResponse<PoiResponse> create(@RequestBody @Valid PoiCreateRequest request) {
        return ApiResponse.<PoiResponse>builder()
                .message("Admin created POI successfully")
                .result(poiService.create(request))
                .build();
    }

    @PutMapping("/{id}")
    ApiResponse<PoiResponse> update(@PathVariable Integer id, @RequestBody @Valid PoiUpdateRequest request) {
        return ApiResponse.<PoiResponse>builder()
                .message("Admin updated POI successfully")
                .result(poiService.update(id, request))
                .build();
    }

    @PatchMapping("/{id}/status")
    ApiResponse<PoiResponse> updateStatus(@PathVariable Integer id, @RequestBody @Valid PoiStatusUpdateRequest request) {
        return ApiResponse.<PoiResponse>builder()
                .message("Admin updated POI status successfully")
                .result(poiService.updateStatus(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    ApiResponse<Void> delete(@PathVariable Integer id) {
        poiService.delete(id);
        return ApiResponse.<Void>builder()
                .message("Admin deleted POI successfully")
                .build();
    }
}
