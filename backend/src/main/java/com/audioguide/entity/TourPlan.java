package com.audioguide.entity;

import com.audioguide.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tour_plan")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TourPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    User customer;

    Integer budgetTotal;
    Integer tourStopCount;
    Integer timeTotalMin;
    Integer peopleCount;
    Integer estCost;
    LocalDate createdAt;

    @Enumerated(EnumType.STRING)
    Status status;

    @Builder.Default
    @OneToMany(mappedBy = "tourPlan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    List<TourStop> tourStops = new ArrayList<>();
}
