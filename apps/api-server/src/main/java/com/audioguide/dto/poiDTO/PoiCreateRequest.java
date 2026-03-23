package com.audioguide.dto.poiDTO;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PoiCreateRequest {

    @NotNull(message = "REQUEST_BODY_INVALID")
    Integer shopId;

    String description;
    String region;
    String category;

    Boolean riskFlag;

    Integer riskScore;
}
