package com.audioguide.controller;

import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.authDTO.LoginRequest;
import com.audioguide.dto.authDTO.LoginResponse;
import com.audioguide.dto.authDTO.RefreshTokenRequest;
import com.audioguide.dto.userDTO.UserResponse;
import com.audioguide.service.AdminLoginThrottleService;
import com.audioguide.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.text.ParseException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminAuthController {

    AuthenticationService authenticationService;
    AdminLoginThrottleService adminLoginThrottleService;

    @PostMapping("/login")
    ApiResponse<LoginResponse> login(@RequestBody @Valid LoginRequest request, HttpServletRequest httpServletRequest) {
        String loginKey = request.getEmail().trim().toLowerCase() + "|" + resolveClientIp(httpServletRequest);
        adminLoginThrottleService.assertAllowed(loginKey);

        try {
            LoginResponse result = authenticationService.authenticateAdmin(request);
            adminLoginThrottleService.recordSuccess(loginKey);
            return ApiResponse.<LoginResponse>builder()
                    .result(result)
                    .build();
        } catch (RuntimeException ex) {
            adminLoginThrottleService.recordFailure(loginKey);
            throw ex;
        }
    }

    @PostMapping("/refresh")
    ApiResponse<LoginResponse> refresh(@RequestBody @Valid RefreshTokenRequest request)
            throws ParseException, JOSEException {
        return ApiResponse.<LoginResponse>builder()
                .result(authenticationService.refreshAdminToken(request))
                .build();
    }

    @PostMapping("/logout")
    ApiResponse<Void> logout(@RequestHeader(name = "Authorization", required = false) String authorizationHeader)
            throws ParseException, JOSEException {
        authenticationService.logout(authorizationHeader);
        return ApiResponse.<Void>builder()
                .message("Admin logout successfully")
                .build();
    }

    @GetMapping("/me")
    ApiResponse<UserResponse> me() throws JOSEException, ParseException {
        return ApiResponse.<UserResponse>builder()
                .result(authenticationService.getCurrentAdminUser())
                .build();
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
