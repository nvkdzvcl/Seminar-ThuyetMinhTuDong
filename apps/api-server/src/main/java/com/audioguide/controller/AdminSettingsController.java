package com.audioguide.controller;

import com.audioguide.dto.adminDTO.AdminSettingResponse;
import com.audioguide.dto.adminDTO.AdminSettingUpsertRequest;
import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.service.AdminSettingService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/settings")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminSettingsController {

    AdminSettingService adminSettingService;

    @GetMapping
    ApiResponse<List<AdminSettingResponse>> getSettings() {
        return ApiResponse.<List<AdminSettingResponse>>builder()
                .message("Get admin settings successfully")
                .result(adminSettingService.getSettings())
                .build();
    }

    @PatchMapping
    ApiResponse<List<AdminSettingResponse>> upsertSettings(
            @RequestBody List<@Valid AdminSettingUpsertRequest> request
    ) {
        return ApiResponse.<List<AdminSettingResponse>>builder()
                .message("Update admin settings successfully")
                .result(adminSettingService.upsertSettings(request))
                .build();
    }
}
