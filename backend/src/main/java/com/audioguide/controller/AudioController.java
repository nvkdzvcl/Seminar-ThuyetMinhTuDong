package com.audioguide.controller;


import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.audioDTO.AudioCreationRequest;
import com.audioguide.dto.audioDTO.AudioResponse;
import com.audioguide.service.AudioService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/audio")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AudioController {

    AudioService audioService;

    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AudioResponse> createAudio(@ModelAttribute AudioCreationRequest request) {
        return ApiResponse.<AudioResponse>builder()
                .message("Audio created successfully")
                .result(audioService.createAudio(request))
                .build();
    }

}