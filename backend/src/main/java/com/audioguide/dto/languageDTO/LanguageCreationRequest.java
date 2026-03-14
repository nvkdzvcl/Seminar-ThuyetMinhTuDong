package com.audioguide.dto.languageDTO;


import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LanguageCreationRequest {

    @NotBlank(message = "LANGUAGE_NAME_BLANK")
    String languageName;

    @NotBlank(message = "LANGUAGE_CODE_BLANK")
    String code;



}
