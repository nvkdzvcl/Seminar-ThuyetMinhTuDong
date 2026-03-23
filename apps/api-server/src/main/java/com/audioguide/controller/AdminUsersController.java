package com.audioguide.controller;

import com.audioguide.dto.adminDTO.AdminUserResponse;
import com.audioguide.dto.adminDTO.AdminUserRoleUpdateRequest;
import com.audioguide.dto.adminDTO.AdminUserStatusUpdateRequest;
import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.enums.UserRole;
import com.audioguide.enums.UserStatus;
import com.audioguide.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminUsersController {

    AdminUserService adminUserService;

    @GetMapping
    ApiResponse<PagingDto<AdminUserResponse>> getUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status
    ) {
        return ApiResponse.<PagingDto<AdminUserResponse>>builder()
                .message("Get admin users successfully")
                .result(adminUserService.getUsers(page, size, search, role, status))
                .build();
    }

    @GetMapping("/{id}")
    ApiResponse<AdminUserResponse> getUserById(@PathVariable Integer id) {
        return ApiResponse.<AdminUserResponse>builder()
                .message("Get admin user detail successfully")
                .result(adminUserService.getUserById(id))
                .build();
    }

    @PatchMapping("/{id}/role")
    ApiResponse<AdminUserResponse> updateRole(
            @PathVariable Integer id,
            @RequestBody @Valid AdminUserRoleUpdateRequest request
    ) {
        return ApiResponse.<AdminUserResponse>builder()
                .message("Update user role successfully")
                .result(adminUserService.updateRole(id, request.getRole()))
                .build();
    }

    @PatchMapping("/{id}/status")
    ApiResponse<AdminUserResponse> updateStatus(
            @PathVariable Integer id,
            @RequestBody @Valid AdminUserStatusUpdateRequest request
    ) {
        return ApiResponse.<AdminUserResponse>builder()
                .message("Update user status successfully")
                .result(adminUserService.updateStatus(id, request.getStatus()))
                .build();
    }
}
