package com.audioguide.dto.poiDTO;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PoiApprovalSummaryResponse {
    Integer shopId;
    Integer poiId;
    String status;
    String rejectionReason;
    List<PoiApprovalHistoryItemResponse> history;
}
