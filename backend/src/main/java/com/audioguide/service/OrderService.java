package com.audioguide.service;


import com.audioguide.dto.orderDTO.OrderCreationRequest;
import com.audioguide.dto.orderDTO.OrderResponse;
import com.audioguide.dto.orderItemDTO.OrderItemResponse;
import com.audioguide.entity.OrderItem;
import com.audioguide.enums.PaymentMethod;
import com.audioguide.enums.PaymentStatus;
import com.audioguide.enums.Status;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.mapper.OrderMapper;
import com.audioguide.repository.OrderRepository;
import com.audioguide.repository.ShopRepository;
import com.audioguide.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderService {

    OrderMapper orderMapper;
    OrderRepository orderRepository;
    UserRepository userRepository;
    OrderItemService orderItemService;
    ShopRepository shopRepository;
    DishService dishService;


    @Transactional
    public OrderResponse createOrder(Integer customerId, OrderCreationRequest request){

        var shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> {
                    log.error("Shop with id {} not found", request.getShopId());
                    return new AppException(ErrorCode.SHOP_NOT_FOUND);
                });

        var user = userRepository.findById(customerId)
                .orElseThrow(() -> {
                    log.error("User with id {} not found", customerId);
                    return new AppException(ErrorCode.USER_NOT_FOUND);
                });

        var orderEntity = orderMapper.toOrderFromOrderCreationRequest(request);

        orderEntity.setCustomer(user);
        orderEntity.setShop(shop);
        orderEntity.setStatus(Status.ACTIVE);
        orderEntity.setPaymentMethod(PaymentMethod.BANKING);
        orderEntity.setPaymentStatus(PaymentStatus.PENDING);
        orderEntity.setCreatedAt(LocalDate.now());

        var savedOrder = orderRepository.save(orderEntity);

        // create order items
        List<OrderItem> orderItems = orderItemService.createOrderItems(savedOrder, request.getOrderItems());

        // tính total price
        Integer totalPrice = orderItems.stream()
                .mapToInt(item -> item.getPricePerUnit() * item.getQuantity())
                .sum();

        savedOrder.setTotalPrice(totalPrice);

        orderRepository.save(savedOrder);

        log.info("Order created successfully for user {}", customerId);

        savedOrder.setOrderItems(orderItems);
        return orderMapper.toOrderResponse(savedOrder);
    }


    public OrderResponse getOrderById(Integer orderId) {
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        log.info("Order with id {} retrieved successfully", orderId);
        return orderMapper.toOrderResponse(order);
    }


}