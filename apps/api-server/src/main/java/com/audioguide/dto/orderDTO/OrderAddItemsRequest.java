package com.audioguide.dto.orderDTO;

import com.audioguide.dto.orderItemDTO.OrderItemCreationRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderAddItemsRequest {

    @NotEmpty(message = "DISH_IDS_EMPTY")
    List<@Valid OrderItemCreationRequest> orderItems;
}
