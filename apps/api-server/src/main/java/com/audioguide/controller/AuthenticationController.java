package com.audioguide.controller;


import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.authDTO.LoginRequest;
import com.audioguide.dto.authDTO.LoginResponse;
import com.audioguide.dto.authDTO.UpdateCurrentLanguageRequest;
import com.audioguide.dto.userDTO.UserResponse;
import com.audioguide.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import jakarta.validation.Valid;
import java.text.ParseException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {

    AuthenticationService authenticationService;

    @PostMapping("/login")
    ApiResponse<LoginResponse> authenticate(@RequestBody @Valid LoginRequest request){
        var result =  authenticationService.authenticate(request);
        return ApiResponse.<LoginResponse>builder()
                .result(result)
                .build();
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyAuthority('CUSTOMER','OWNER_SHOP','ADMIN','SUPER_ADMIN')")
    ApiResponse<UserResponse> getCurrentUser() throws JOSEException, ParseException {
        var result = authenticationService.getUserFromToken();
        return ApiResponse.<UserResponse>builder()
                .result(result)
                .build();
    }

    // Keep backward compatibility for any client that still calls POST /auth/me.
    @PostMapping("/me")
    @PreAuthorize("hasAnyAuthority('CUSTOMER','OWNER_SHOP','ADMIN','SUPER_ADMIN')")
    ApiResponse<UserResponse> getCurrentUserPost() throws JOSEException, ParseException {
        return getCurrentUser();
    }

    @PostMapping("/logout")
    @PreAuthorize("hasAnyAuthority('CUSTOMER','OWNER_SHOP','ADMIN','SUPER_ADMIN')")
    ApiResponse<Void> logout(@RequestHeader(name = "Authorization", required = false) String authorizationHeader)
            throws ParseException, JOSEException {
        authenticationService.logout(authorizationHeader);
        return ApiResponse.<Void>builder()
                .message("Logout successfully")
                .build();
    }

    @PatchMapping("/me/language")
    @PreAuthorize("hasAnyAuthority('CUSTOMER','OWNER_SHOP','ADMIN','SUPER_ADMIN')")
    ApiResponse<UserResponse> updateCurrentUserLanguage(
            @RequestBody @Valid UpdateCurrentLanguageRequest request
    ) {
        return ApiResponse.<UserResponse>builder()
                .message("Update current user language successfully")
                .result(authenticationService.updateCurrentUserLanguage(request.getLanguage()))
                .build();
    }

}
