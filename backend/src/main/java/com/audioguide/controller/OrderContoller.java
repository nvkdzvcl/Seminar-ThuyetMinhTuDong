package com.audioguide.controller;


import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.orderDTO.OrderCreationRequest;
import com.audioguide.dto.orderDTO.OrderResponse;
import com.audioguide.service.OrderService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/order")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderContoller {

    OrderService orderService;


    @PostMapping("/create")
    public ApiResponse<OrderResponse> createOrder(@RequestBody @Valid OrderCreationRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer userId = Integer.parseInt(authentication.getName());

        OrderResponse orderResponse = orderService.createOrder(userId, request);

        return ApiResponse.<OrderResponse>builder()
                .message("Order created successfully")
                .result(orderResponse)
                .build();
    }

    @GetMapping("/orderid/{orderId}")
    public ApiResponse<OrderResponse> getOrderById(@PathVariable Integer orderId) {

        OrderResponse orderResponse = orderService.getOrderById(orderId);

        return ApiResponse.<OrderResponse>builder()
                .message("Order retrieved successfully")
                .result(orderResponse)
                .build();
    }
}
