package com.audioguide.dto.orderDTO;


import com.audioguide.dto.orderItemDTO.OrderItemResponse;
import com.audioguide.enums.OrderWorkflowStatus;
import com.audioguide.enums.PaymentMethod;
import com.audioguide.enums.PaymentStatus;
import com.audioguide.enums.Status;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderResponse {

    Integer id;

    Integer shopId;
    String shopName;

    Integer customerId;
    String customerName;

    Integer totalPrice;
    PaymentMethod paymentMethod;
    LocalDate createdAt;
    PaymentStatus paymentStatus;
    Status status;
    OrderWorkflowStatus orderStatus;

    List<OrderItemResponse> orderItems;
}
