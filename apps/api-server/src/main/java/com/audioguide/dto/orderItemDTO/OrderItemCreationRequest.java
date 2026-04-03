package com.audioguide.dto.orderItemDTO;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemCreationRequest {

    @NotNull(message = "DISH_ID_NOT_BLANK")
    @Min(value = 1, message = "DISH_ID_NOT_BLANK")
    Integer dishId;

    @NotNull(message = "ORDER_ITEM_QUANTITY_INVALID")
    @Min(value = 1, message = "ORDER_ITEM_QUANTITY_INVALID")
    Integer quantity;

}
