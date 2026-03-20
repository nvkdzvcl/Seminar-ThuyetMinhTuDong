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
public class OrderItemCreationRequest {

    Integer dishId;
    Integer quantity;

}
