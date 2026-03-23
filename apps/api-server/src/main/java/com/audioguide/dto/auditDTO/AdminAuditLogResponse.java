package com.audioguide.dto.auditDTO;

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
public class AdminAuditLogResponse {
    Long id;
    Integer actorId;
    String actorEmail;
    String actorRole;
    String action;
    String method;
    String path;
    Integer statusCode;
    String ipAddress;
    String userAgent;
    String detail;
    LocalDateTime createdAt;
}
