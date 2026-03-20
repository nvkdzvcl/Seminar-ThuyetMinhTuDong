package com.audioguide.mapper;

import com.audioguide.dto.orderItemDTO.OrderItemResponse;
import com.audioguide.entity.Order;
import com.audioguide.entity.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface OrderItemMapper {



    @Mapping(target = "dishId", source = "orderItem.dish.id")
    @Mapping(target = "orderId", source = "orderItem.order.id")
    OrderItemResponse toOrderItemResponse(OrderItem orderItem);

    List<OrderItemResponse> toOrderItemResponseList(List<OrderItem> orderItems);
}