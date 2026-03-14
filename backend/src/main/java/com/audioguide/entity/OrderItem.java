package com.audioguide.entity;


import com.audioguide.enums.OrderItemStatus;
import com.audioguide.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "order_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    @ManyToOne
    @JoinColumn(name = "dish_id")
    Dish dish;

    @ManyToOne
    @JoinColumn(name = "order_id")
    Order order;

    Integer quantity;

    Integer pricePerUnit;

    OrderItemStatus status;



}