package com.audioguide.dto.poiDTO;

import java.util.List;
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
public class PoiDetailResponse {
    PoiResponse poi;
    List<PoiMenuItemResponse> menuItems;
    List<PoiModerationLogResponse> moderationLogs;
    List<PoiApprovalHistoryItemResponse> approvalHistory;
}
