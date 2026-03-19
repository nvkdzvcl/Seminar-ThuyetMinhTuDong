package com.audioguide.controller;


import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.authDTO.LoginRequest;
import com.audioguide.dto.authDTO.LoginResponse;
import com.audioguide.dto.userDTO.UserResponse;
import com.audioguide.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    @PostMapping("/me")
    ApiResponse<UserResponse> getCurrentUser() throws Exception {
        var result = authenticationService.getUserFromToken();
        return ApiResponse.<UserResponse>builder()
                .result(result)
                .build();
    }



}
