package com.audioguide.entity;


import com.audioguide.enums.PaymentMethod;
import com.audioguide.enums.PaymentStatus;
import com.audioguide.enums.OrderWorkflowStatus;
import com.audioguide.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    @ManyToOne
    @JoinColumn(name = "shop_id")
    Shop shop;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    User customer;


    Integer totalPrice;

    PaymentMethod paymentMethod;

    LocalDate createdAt;

    PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    Status status;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", length = 32)
    OrderWorkflowStatus orderStatus;

    @OneToMany(mappedBy = "order", fetch = FetchType.EAGER)
    List<OrderItem> orderItems;
    


}
