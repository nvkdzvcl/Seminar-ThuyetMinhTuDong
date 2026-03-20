package com.audioguide.service;


import com.audioguide.dto.orderDTO.OrderResponse;
import com.audioguide.dto.orderItemDTO.OrderItemCreationRequest;
import com.audioguide.entity.Dish;
import com.audioguide.entity.Order;
import com.audioguide.entity.OrderItem;
import com.audioguide.enums.OrderItemStatus;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.repository.DishRepository;
import com.audioguide.repository.OrderItemRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;


@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderItemService {

    DishRepository dishRepository;
    OrderItemRepository orderItemRepository;

    public Integer calculateTotalPrice(List<OrderItemCreationRequest> orderItems) {
        return orderItems.stream()
                .map(orderItem -> dishRepository.findById(orderItem.getDishId())
                        .orElseThrow(() -> {
                            log.error("Dish with id {} not found", orderItem.getDishId());
                            return new RuntimeException("Dish not found");
                        }).getPrice() * orderItem.getQuantity())
                .reduce(0, Integer::sum);

    }

    public List<OrderItem> createOrderItems(Order order, List<OrderItemCreationRequest> requests){

        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderItemCreationRequest req : requests){

            Dish dish = dishRepository.findById(req.getDishId())
                    .orElseThrow(() -> new AppException(ErrorCode.DISH_NOT_FOUND));

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setDish(dish);
            item.setQuantity(req.getQuantity());
            item.setPricePerUnit(dish.getPrice());
            item.setStatus(OrderItemStatus.WAITING);
            orderItems.add(item);
        }

        return orderItemRepository.saveAll(orderItems);
    }




}