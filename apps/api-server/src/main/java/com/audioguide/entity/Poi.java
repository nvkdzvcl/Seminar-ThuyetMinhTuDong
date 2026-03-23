package com.audioguide.entity;

import com.audioguide.enums.PoiStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "poi")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Poi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    @Column(nullable = false)
    Integer shopId;

    @Column(nullable = false)
    String name;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(nullable = false)
    String address;

    Double lat;

    Double lng;

    String region;

    String category;

    Integer ownerId;

    String ownerName;

    String coverImage;

    @Column(unique = true)
    String qrCode;

    @Column(nullable = false)
    Boolean riskFlag;

    Integer riskScore;

    String rejectionReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    PoiStatus status;

    @Column(nullable = false)
    LocalDateTime createdAt;

    @Column(nullable = false)
    LocalDateTime updatedAt;
}
