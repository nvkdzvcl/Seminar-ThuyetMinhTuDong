package com.audioguide.dto.poiDTO;

import java.time.LocalDateTime;
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
public class PoiModerationLogResponse {
    Integer id;
    Integer menuItemId;
    String fieldName;
    String textSnapshot;
    Integer riskScore;
    String labels;
    String matchedTerms;
    String suggestedRewrite;
    String modelVersion;
    String status;
    String reviewedBy;
    LocalDateTime reviewedAt;
    LocalDateTime createdAt;
}
