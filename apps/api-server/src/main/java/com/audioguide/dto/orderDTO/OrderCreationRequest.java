package com.audioguide.dto.orderDTO;


import com.audioguide.dto.orderItemDTO.OrderItemCreationRequest;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderCreationRequest {

    @NotNull(message = "SHOP_ID_NOT_BLANK")
    Integer shopId;

    @NotEmpty(message = "DISH_IDS_EMPTY")
    List<OrderItemCreationRequest> orderItems;

}
