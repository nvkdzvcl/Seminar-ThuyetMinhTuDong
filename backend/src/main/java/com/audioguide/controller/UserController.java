package com.audioguide.controller;


import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.userDTO.UserCreationRequest;
import com.audioguide.dto.userDTO.UserResponse;
import com.audioguide.dto.userDTO.UserUpdateRequest;
import com.audioguide.enums.SortDirection;
import com.audioguide.enums.UserStatus;
import com.audioguide.service.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserController {

    UserService userService;

    @PostMapping
    ApiResponse<UserResponse> createUser(@RequestBody @Valid UserCreationRequest request){
        return ApiResponse.<UserResponse>builder()
                .message("User created successfully")
                .result(userService.createUser(request))
                .build();
    }

    @GetMapping("/{id}")
    ApiResponse<UserResponse> getUserById(@PathVariable Integer id){
        return ApiResponse.<UserResponse>builder()
                .message("Get user successfully")
                .result(userService.getUserById(id))
                .build();
    }

    @GetMapping
    ApiResponse<PagingDto<UserResponse>> getAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) SortDirection direction
    ){
        return ApiResponse.<PagingDto<UserResponse>>builder()
                .message("Get users successfully")
                .result(userService.getAllUsers(page, size, status, sortBy, direction))
                .build();
    }

    @PatchMapping("/{id}")
    ApiResponse<UserResponse> updateUserById(@PathVariable Integer id, @RequestBody @Valid UserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .message("User updated successfully")
                .result(userService.updateUserById(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    ApiResponse<Boolean> deleteUserById(@PathVariable Integer id) {
        userService.deleteUserById(id);
        return ApiResponse.<Boolean>builder()
                .message("User deleted successfully")
                .build();
    }
}
