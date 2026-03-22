package com.audioguide.dto.poiDTO;

import com.audioguide.enums.PoiStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PoiStatusUpdateRequest {

    @NotNull(message = "REQUEST_BODY_INVALID")
    PoiStatus status;

    String reason;
}
