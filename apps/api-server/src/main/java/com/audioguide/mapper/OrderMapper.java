package com.audioguide.mapper;

import com.audioguide.dto.dishDTO.DishCreationRequest;
import com.audioguide.dto.dishDTO.DishResponse;
import com.audioguide.dto.dishDTO.DishUpdateRequest;
import com.audioguide.dto.orderDTO.OrderCreationRequest;
import com.audioguide.dto.orderDTO.OrderResponse;
import com.audioguide.entity.Dish;
import com.audioguide.entity.Order;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", uses = OrderItemMapper.class)
public interface OrderMapper {

    Order toOrderFromOrderCreationRequest(OrderCreationRequest request);

    @Mapping(target = "shopId", source = "shop.id")
    @Mapping(target = "orderItems", source = "orderItems")
    OrderResponse toOrderResponse(Order order);

}