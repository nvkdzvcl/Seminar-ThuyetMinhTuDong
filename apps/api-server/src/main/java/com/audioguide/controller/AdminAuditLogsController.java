package com.audioguide.controller;

import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.auditDTO.AdminAuditLogResponse;
import com.audioguide.service.AdminAuditLogService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/audit-logs")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminAuditLogsController {

    AdminAuditLogService adminAuditLogService;

    @GetMapping
    ApiResponse<PagingDto<AdminAuditLogResponse>> getLogs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.<PagingDto<AdminAuditLogResponse>>builder()
                .message("Get admin audit logs successfully")
                .result(adminAuditLogService.getLogs(page, size))
                .build();
    }
}
