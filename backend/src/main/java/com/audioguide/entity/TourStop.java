package com.audioguide.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.ArrayList;
import java.util.List;

@Table(name = "tour_stop")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
public class TourStop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id")
    Shop shop;

    Integer stopIndex;
    Integer plannedCost;
    Integer timeToSpendInMinutes;

    @Builder.Default
    @OneToMany(mappedBy = "tourStop", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    List<TourStopItem> tourStopItems = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tour_plan_id")
    TourPlan tourPlan;
}
