package com.audioguide.dto.shopDTO;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShopNarrationResponse {
    Integer shopId;
    String language;
    String requestedLanguage;
    String voice;
    String script;
    String audioUrl;
    boolean cached;
    boolean fallbackApplied;
}
