package com.audioguide.controller;

import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.translationDTO.UiTranslationRequest;
import com.audioguide.dto.translationDTO.UiTranslationResponse;
import com.audioguide.service.UiTranslationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/translation")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TranslationController {

    UiTranslationService uiTranslationService;

    @PostMapping("/ui")
    ApiResponse<UiTranslationResponse> translateUi(@RequestBody UiTranslationRequest request) {
        return ApiResponse.<UiTranslationResponse>builder()
                .message("Translate UI text successfully")
                .result(uiTranslationService.translateUiTexts(request))
                .build();
    }
}
