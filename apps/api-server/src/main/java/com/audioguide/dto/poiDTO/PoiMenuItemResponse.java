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
public class PoiMenuItemResponse {
    Integer id;
    String name;
    String descriptionText;
    Integer price;
    Double rating;
    String moderationStatus;
    Boolean isSignature;
    String imageUrl;
    String audioScriptText;
    Integer riskScore;
    String riskFlags;
    String status;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
