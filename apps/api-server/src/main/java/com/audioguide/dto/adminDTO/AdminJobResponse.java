package com.audioguide.dto.adminDTO;

import com.audioguide.enums.AdminJobStatus;
import com.audioguide.enums.AdminJobType;
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
public class AdminJobResponse {
    Long id;
    String jobCode;
    AdminJobType type;
    AdminJobStatus status;
    Integer relatedPoiId;
    Integer relatedUserId;
    Integer retryCount;
    String errorMessage;
    LocalDateTime createdAt;
    LocalDateTime startedAt;
    LocalDateTime endedAt;
}
