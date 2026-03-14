package com.audioguide.dto.languageDTO;


import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LanguageResponse {
    Integer id;
    String languageName;
    String code;


}
