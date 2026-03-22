package com.audioguide.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "poi_approval_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PoiApprovalHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    @Column(nullable = false)
    Integer shopId;

    Integer poiId;

    @Column(nullable = false)
    String status;

    @Column(nullable = false)
    LocalDateTime submittedAt;

    String reviewer;

    LocalDateTime reviewedAt;

    @Column(columnDefinition = "TEXT")
    String reason;
}
