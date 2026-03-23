package com.audioguide.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "admin_audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    Integer actorId;

    @Column(length = 255)
    String actorEmail;

    @Column(length = 20)
    String actorRole;

    @Column(length = 16)
    String method;

    @Column(length = 255)
    String path;

    Integer statusCode;

    @Column(length = 128)
    String ipAddress;

    @Column(length = 500)
    String userAgent;

    @Column(length = 32)
    String action;

    @Column(length = 1000)
    String detail;

    LocalDateTime createdAt;
}
