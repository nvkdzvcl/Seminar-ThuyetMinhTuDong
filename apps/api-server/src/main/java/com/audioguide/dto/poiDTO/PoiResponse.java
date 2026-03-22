package com.audioguide.dto.poiDTO;

import com.audioguide.enums.PoiStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PoiResponse {

    Integer id;

    Integer shopId;

    String name;

    String description;

    String address;

    Double lat;

    Double lng;

    String region;

    String category;

    Integer ownerId;

    String ownerName;

    String coverImage;

    Boolean riskFlag;

    Integer riskScore;

    String rejectionReason;

    PoiStatus status;

    LocalDateTime createdAt;

    LocalDateTime updatedAt;
}
