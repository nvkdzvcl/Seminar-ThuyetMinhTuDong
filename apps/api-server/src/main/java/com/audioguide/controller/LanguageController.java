package com.audioguide.controller;


import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.languageDTO.LanguageCreationRequest;
import com.audioguide.dto.languageDTO.LanguageResponse;
import com.audioguide.service.LanguageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/language")
@RequiredArgsConstructor
public class LanguageController {

    private final LanguageService languageService;


    @PreAuthorize("hasAuthority('SCOPE_ADMIN')")
    @GetMapping("/{id}")
    public ApiResponse<LanguageResponse> getLanguageById(@PathVariable Integer id) {
        return ApiResponse.<LanguageResponse>builder()
                .message("Get language successfully")
                .result(languageService.getLanguageById(id))
                .build();
    }


    @PostMapping("/create")
    public ApiResponse<LanguageResponse> createLanguage(@RequestBody @Valid LanguageCreationRequest request) {
        return ApiResponse.<LanguageResponse>builder()
                .message("Language created successfully")
                .result(languageService.createLanguage(request))
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping(value = "/all")
    public ApiResponse<PagingDto<LanguageResponse>> getAllLanguages() {
            return ApiResponse.<PagingDto<LanguageResponse>>builder()
                    .message("Get all languages successfully")
                    .result(languageService.getAllLanguages())
                    .build();
    }




}