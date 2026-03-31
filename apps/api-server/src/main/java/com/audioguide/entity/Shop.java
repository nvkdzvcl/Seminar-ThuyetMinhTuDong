package com.audioguide.entity;


import com.audioguide.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Entity
@Table(name = "shop")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Shop {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;


    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", nullable = false)
    User owner;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "shop_type_id", nullable = false)
    ShopType shopType;


    String name;
    String  address;
    @Column(name = "short_description")
    String shortDescription;
    String description;
    String imageName;
    String audioURL;
    Double lat;
    Double lng;

    Integer avgCostPerPerson;
    Integer avgWaitTimeMin;   // in minutes
    Integer avgEatTimeMin;
    LocalDate createdAt;
    @Enumerated(EnumType.STRING)
    Status status;

}
