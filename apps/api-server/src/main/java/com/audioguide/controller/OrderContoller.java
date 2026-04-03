package com.audioguide.controller;

import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.orderDTO.OrderAddItemsRequest;
import com.audioguide.dto.orderDTO.OrderCreationRequest;
import com.audioguide.dto.orderDTO.OrderResponse;
import com.audioguide.service.OrderService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/order")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderContoller {

    OrderService orderService;

    @PostMapping("/create")
    @PreAuthorize("hasAnyAuthority('CUSTOMER','ADMIN','SUPER_ADMIN')")
    public ApiResponse<OrderResponse> createOrder(@RequestBody @Valid OrderCreationRequest request) {
        Integer userId = getCurrentUserId();
        OrderResponse orderResponse = orderService.createOrder(userId, request);

        return ApiResponse.<OrderResponse>builder()
                .message("Order created successfully")
                .result(orderResponse)
                .build();
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyAuthority('CUSTOMER','ADMIN','SUPER_ADMIN')")
    public ApiResponse<List<OrderResponse>> getMyOrders() {
        Integer userId = getCurrentUserId();
        return ApiResponse.<List<OrderResponse>>builder()
                .message("Get customer orders successfully")
                .result(orderService.getOrdersOfCustomer(userId))
                .build();
    }

    @GetMapping("/shop-owner")
    @PreAuthorize("hasAnyAuthority('OWNER_SHOP','ADMIN','SUPER_ADMIN')")
    public ApiResponse<List<OrderResponse>> getShopOwnerOrders() {
        Integer ownerId = getCurrentUserId();
        return ApiResponse.<List<OrderResponse>>builder()
                .message("Get shop owner orders successfully")
                .result(orderService.getOrdersForShopOwner(ownerId))
                .build();
    }

    @PatchMapping("/{orderId}/cancel-customer")
    @PreAuthorize("hasAnyAuthority('CUSTOMER','ADMIN','SUPER_ADMIN')")
    public ApiResponse<OrderResponse> cancelByCustomer(@PathVariable Integer orderId) {
        Integer customerId = getCurrentUserId();
        return ApiResponse.<OrderResponse>builder()
                .message("Order cancelled by customer")
                .result(orderService.cancelByCustomer(customerId, orderId))
                .build();
    }

    @PatchMapping("/{orderId}/add-items")
    @PreAuthorize("hasAnyAuthority('CUSTOMER','ADMIN','SUPER_ADMIN')")
    public ApiResponse<OrderResponse> addItemsByCustomer(
            @PathVariable Integer orderId,
            @RequestBody @Valid OrderAddItemsRequest request
    ) {
        Integer customerId = getCurrentUserId();
        return ApiResponse.<OrderResponse>builder()
                .message("Order updated successfully")
                .result(orderService.addItemsByCustomer(customerId, orderId, request))
                .build();
    }

    @PatchMapping("/{orderId}/confirm")
    @PreAuthorize("hasAnyAuthority('OWNER_SHOP','ADMIN','SUPER_ADMIN')")
    public ApiResponse<OrderResponse> confirmByShopOwner(@PathVariable Integer orderId) {
        Integer ownerId = getCurrentUserId();
        return ApiResponse.<OrderResponse>builder()
                .message("Order confirmed successfully")
                .result(orderService.confirmByShopOwner(ownerId, orderId))
                .build();
    }

    @PatchMapping("/{orderId}/complete")
    @PreAuthorize("hasAnyAuthority('OWNER_SHOP','ADMIN','SUPER_ADMIN')")
    public ApiResponse<OrderResponse> completeByShopOwner(@PathVariable Integer orderId) {
        Integer ownerId = getCurrentUserId();
        return ApiResponse.<OrderResponse>builder()
                .message("Order completed successfully")
                .result(orderService.completeByShopOwner(ownerId, orderId))
                .build();
    }

    @PatchMapping("/{orderId}/cancel-shop")
    @PreAuthorize("hasAnyAuthority('OWNER_SHOP','ADMIN','SUPER_ADMIN')")
    public ApiResponse<OrderResponse> cancelByShopOwner(@PathVariable Integer orderId) {
        Integer ownerId = getCurrentUserId();
        return ApiResponse.<OrderResponse>builder()
                .message("Order cancelled by shop")
                .result(orderService.cancelByShopOwner(ownerId, orderId))
                .build();
    }

    @GetMapping("/orderid/{orderId}")
    @PreAuthorize("hasAnyAuthority('CUSTOMER','OWNER_SHOP','ADMIN','SUPER_ADMIN')")
    public ApiResponse<OrderResponse> getOrderById(@PathVariable Integer orderId) {
        OrderResponse orderResponse = orderService.getOrderById(orderId);

        return ApiResponse.<OrderResponse>builder()
                .message("Order retrieved successfully")
                .result(orderResponse)
                .build();
    }

    private Integer getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return Integer.parseInt(authentication.getName());
    }
}
