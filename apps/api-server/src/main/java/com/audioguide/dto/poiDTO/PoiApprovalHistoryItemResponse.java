package com.audioguide.dto.poiDTO;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PoiApprovalHistoryItemResponse {
    Integer id;
    Integer shopId;
    Integer poiId;
    String status;
    LocalDateTime submittedAt;
    String reviewer;
    LocalDateTime reviewedAt;
    String reason;
}
