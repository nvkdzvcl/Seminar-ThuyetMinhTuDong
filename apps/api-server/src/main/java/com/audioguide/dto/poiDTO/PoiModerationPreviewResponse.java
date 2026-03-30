package com.audioguide.dto.poiDTO;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PoiModerationPreviewResponse {
    String decision;
    String status;
    Integer riskScore;
    List<String> labels;
    List<String> matchedTerms;
    List<String> reasons;
    String suggestedRewrite;
    String modelVersion;
    String message;
}
