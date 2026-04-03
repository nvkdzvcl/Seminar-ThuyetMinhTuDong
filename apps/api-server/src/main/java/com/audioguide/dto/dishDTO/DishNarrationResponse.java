package com.audioguide.dto.dishDTO;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DishNarrationResponse {
    Integer dishId;
    Integer shopId;
    String language;
    String languageKey;
    String requestedLanguage;
    String voice;
    String sourceText;
    String script;
    String audioUrl;
    boolean cached;
    boolean fallbackApplied;
    LocalDateTime updatedAt;
}

