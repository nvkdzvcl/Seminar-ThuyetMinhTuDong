package com.audioguide.entity;

import com.audioguide.enums.AdminJobStatus;
import com.audioguide.enums.AdminJobType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "admin_jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminJob {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, unique = true, length = 64)
    String jobCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    AdminJobType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    AdminJobStatus status;

    Integer relatedPoiId;
    Integer relatedUserId;

    @Column(nullable = false)
    Integer retryCount;

    @Column(length = 1000)
    String errorMessage;

    @Column(nullable = false)
    LocalDateTime createdAt;

    LocalDateTime startedAt;
    LocalDateTime endedAt;
}
