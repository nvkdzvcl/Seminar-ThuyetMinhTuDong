package com.audioguide.dto.orderItemDTO;

import com.audioguide.entity.Dish;
import com.audioguide.enums.OrderItemStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemResponse {

    Integer id;
    Integer  orderId;
    Integer dishId;
    Integer quantity;
    Integer pricePerUnit;
    OrderItemStatus status;

}
