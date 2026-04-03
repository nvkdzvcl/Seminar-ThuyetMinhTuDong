package com.audioguide.service;


import com.audioguide.dto.orderItemDTO.OrderItemCreationRequest;
import com.audioguide.entity.Dish;
import com.audioguide.entity.Order;
import com.audioguide.entity.OrderItem;
import com.audioguide.enums.OrderItemStatus;
import com.audioguide.enums.OrderWorkflowStatus;
import com.audioguide.enums.Status;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderItemService {

    DishRepository dishRepository;
    OrderItemRepository orderItemRepository;

    public List<OrderItem> createOrderItems(Order order, List<OrderItemCreationRequest> requests) {
        return upsertOrderItems(order, requests, OrderWorkflowStatus.WAIT, false);
    }

    public List<OrderItem> appendOrderItems(Order order, List<OrderItemCreationRequest> requests, OrderWorkflowStatus workflowStatus) {
        return upsertOrderItems(order, requests, workflowStatus, true);
    }

    public List<OrderItem> updateStatusesByOrder(Integer orderId, OrderItemStatus itemStatus) {
        List<OrderItem> orderItems = orderItemRepository.findByOrder_Id(orderId);
        if (orderItems.isEmpty()) {
            return orderItems;
        }

        for (OrderItem orderItem : orderItems) {
            orderItem.setStatus(itemStatus);
        }

        return orderItemRepository.saveAll(orderItems);
    }

    public Integer calculateTotalPrice(List<OrderItem> orderItems) {
        return orderItems.stream()
                .mapToInt(item -> safeInt(item.getPricePerUnit()) * safeInt(item.getQuantity()))
                .sum();
    }

    private List<OrderItem> upsertOrderItems(
            Order order,
            List<OrderItemCreationRequest> requests,
            OrderWorkflowStatus workflowStatus,
            boolean mergeWithExisting
    ) {
        List<OrderItem> orderItems = mergeWithExisting
                ? new ArrayList<>(orderItemRepository.findByOrder_Id(order.getId()))
                : new ArrayList<>();

        Map<Integer, OrderItem> itemByDishId = new LinkedHashMap<>();
        for (OrderItem item : orderItems) {
            if (item.getDish() != null && item.getDish().getId() != null) {
                itemByDishId.put(item.getDish().getId(), item);
            }
        }

        OrderItemStatus targetItemStatus = resolveItemStatusForOrder(workflowStatus);

        for (OrderItemCreationRequest req : requests) {
            Dish dish = dishRepository.findById(req.getDishId())
                    .orElseThrow(() -> new AppException(ErrorCode.DISH_NOT_FOUND));

            validateDishForOrder(order, dish);
            int quantity = safeInt(req.getQuantity());
            if (quantity <= 0) {
                throw new AppException(ErrorCode.ORDER_ITEM_QUANTITY_INVALID);
            }

            OrderItem existingItem = itemByDishId.get(dish.getId());
            if (existingItem != null) {
                existingItem.setQuantity(safeInt(existingItem.getQuantity()) + quantity);
                existingItem.setPricePerUnit(safeInt(dish.getPrice()));
                existingItem.setStatus(targetItemStatus);
                continue;
            }

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setDish(dish);
            item.setQuantity(quantity);
            item.setPricePerUnit(safeInt(dish.getPrice()));
            item.setStatus(targetItemStatus);
            orderItems.add(item);
            itemByDishId.put(dish.getId(), item);
        }

        return orderItemRepository.saveAll(orderItems);
    }

    private void validateDishForOrder(Order order, Dish dish) {
        if (order.getShop() == null || order.getShop().getId() == null) {
            throw new AppException(ErrorCode.SHOP_NOT_FOUND);
        }
        if (dish.getShop() == null || dish.getShop().getId() == null) {
            throw new AppException(ErrorCode.DISH_NOT_AVAILABLE);
        }
        if (!order.getShop().getId().equals(dish.getShop().getId())) {
            throw new AppException(ErrorCode.DISH_NOT_AVAILABLE);
        }
        if (dish.getStatus() != Status.ACTIVE) {
            throw new AppException(ErrorCode.DISH_NOT_AVAILABLE);
        }
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private OrderItemStatus resolveItemStatusForOrder(OrderWorkflowStatus workflowStatus) {
        if (workflowStatus == null) {
            return OrderItemStatus.WAITING;
        }
        return switch (workflowStatus) {
            case WAIT -> OrderItemStatus.WAITING;
            case PREPARING -> OrderItemStatus.IN_PROGRESS;
            case COMPLETED -> OrderItemStatus.COMPLETED;
            case CUSTOMER_CANCELLED, SHOP_CANCELLED -> OrderItemStatus.CANCELLED;
        };
    }

}
