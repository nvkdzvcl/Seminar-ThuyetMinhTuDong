package com.audioguide.service;

import com.audioguide.dto.orderDTO.OrderAddItemsRequest;
import com.audioguide.dto.orderDTO.OrderCreationRequest;
import com.audioguide.dto.orderDTO.OrderResponse;
import com.audioguide.entity.Order;
import com.audioguide.entity.OrderItem;
import com.audioguide.enums.OrderItemStatus;
import com.audioguide.enums.OrderWorkflowStatus;
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

    @Transactional
    public OrderResponse createOrder(Integer customerId, OrderCreationRequest request) {

        var shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> {
                    log.error("Shop with id {} not found", request.getShopId());
                    return new AppException(ErrorCode.SHOP_NOT_FOUND);
                });
        if (shop.getStatus() != Status.ACTIVE) {
            throw new AppException(ErrorCode.SHOP_NOT_ACTIVE);
        }

        var user = userRepository.findById(customerId)
                .orElseThrow(() -> {
                    log.error("User with id {} not found", customerId);
                    return new AppException(ErrorCode.USER_NOT_FOUND);
                });

        Order orderEntity = new Order();

        orderEntity.setCustomer(user);
        orderEntity.setShop(shop);
        orderEntity.setStatus(Status.ACTIVE);
        orderEntity.setPaymentMethod(PaymentMethod.BANKING);
        orderEntity.setPaymentStatus(PaymentStatus.PENDING);
        orderEntity.setCreatedAt(LocalDate.now());
        orderEntity.setOrderStatus(OrderWorkflowStatus.WAIT);

        var savedOrder = orderRepository.save(orderEntity);

        List<OrderItem> orderItems = orderItemService.createOrderItems(savedOrder, request.getOrderItems());
        savedOrder.setTotalPrice(orderItemService.calculateTotalPrice(orderItems));
        savedOrder.setOrderItems(orderItems);
        orderRepository.save(savedOrder);

        log.info("Order created successfully for user {}", customerId);

        return orderMapper.toOrderResponse(savedOrder);
    }

    public List<OrderResponse> getOrdersOfCustomer(Integer customerId) {
        userRepository.findById(customerId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return orderRepository.findByCustomer_IdOrderByIdDesc(customerId)
                .stream()
                .map(this::toResponseWithNormalizedStatus)
                .toList();
    }

    public List<OrderResponse> getOrdersForShopOwner(Integer ownerId) {
        userRepository.findById(ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return orderRepository.findByShop_Owner_IdOrderByIdDesc(ownerId)
                .stream()
                .map(this::toResponseWithNormalizedStatus)
                .toList();
    }

    @Transactional
    public OrderResponse cancelByCustomer(Integer customerId, Integer orderId) {
        Order order = orderRepository.findByIdAndCustomer_Id(orderId, customerId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        OrderWorkflowStatus currentStatus = resolveWorkflowStatus(order);
        if (currentStatus == OrderWorkflowStatus.PREPARING) {
            throw new AppException(ErrorCode.ORDER_CUSTOMER_CANNOT_CANCEL_PREPARING);
        }
        if (currentStatus != OrderWorkflowStatus.WAIT) {
            throw new AppException(ErrorCode.ORDER_STATUS_INVALID_TRANSITION);
        }

        order.setOrderStatus(OrderWorkflowStatus.CUSTOMER_CANCELLED);
        order.setPaymentStatus(PaymentStatus.FAILED);
        List<OrderItem> items = orderItemService.updateStatusesByOrder(order.getId(), OrderItemStatus.CANCELLED);
        order.setOrderItems(items);
        orderRepository.save(order);
        return orderMapper.toOrderResponse(order);
    }

    @Transactional
    public OrderResponse confirmByShopOwner(Integer ownerId, Integer orderId) {
        Order order = orderRepository.findByIdAndShop_Owner_Id(orderId, ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        OrderWorkflowStatus currentStatus = resolveWorkflowStatus(order);
        if (currentStatus != OrderWorkflowStatus.WAIT) {
            throw new AppException(ErrorCode.ORDER_STATUS_INVALID_TRANSITION);
        }

        order.setOrderStatus(OrderWorkflowStatus.PREPARING);
        List<OrderItem> items = orderItemService.updateStatusesByOrder(order.getId(), OrderItemStatus.IN_PROGRESS);
        order.setOrderItems(items);
        orderRepository.save(order);
        return orderMapper.toOrderResponse(order);
    }

    @Transactional
    public OrderResponse completeByShopOwner(Integer ownerId, Integer orderId) {
        Order order = orderRepository.findByIdAndShop_Owner_Id(orderId, ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        OrderWorkflowStatus currentStatus = resolveWorkflowStatus(order);
        if (currentStatus != OrderWorkflowStatus.PREPARING) {
            throw new AppException(ErrorCode.ORDER_STATUS_INVALID_TRANSITION);
        }

        order.setOrderStatus(OrderWorkflowStatus.COMPLETED);
        order.setPaymentStatus(PaymentStatus.COMPLETED);
        List<OrderItem> items = orderItemService.updateStatusesByOrder(order.getId(), OrderItemStatus.COMPLETED);
        order.setOrderItems(items);
        orderRepository.save(order);
        return orderMapper.toOrderResponse(order);
    }

    @Transactional
    public OrderResponse cancelByShopOwner(Integer ownerId, Integer orderId) {
        Order order = orderRepository.findByIdAndShop_Owner_Id(orderId, ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        OrderWorkflowStatus currentStatus = resolveWorkflowStatus(order);
        if (currentStatus != OrderWorkflowStatus.WAIT && currentStatus != OrderWorkflowStatus.PREPARING) {
            throw new AppException(ErrorCode.ORDER_STATUS_INVALID_TRANSITION);
        }

        order.setOrderStatus(OrderWorkflowStatus.SHOP_CANCELLED);
        order.setPaymentStatus(PaymentStatus.FAILED);
        List<OrderItem> items = orderItemService.updateStatusesByOrder(order.getId(), OrderItemStatus.CANCELLED);
        order.setOrderItems(items);
        orderRepository.save(order);
        return orderMapper.toOrderResponse(order);
    }

    @Transactional
    public OrderResponse addItemsByCustomer(Integer customerId, Integer orderId, OrderAddItemsRequest request) {
        Order order = orderRepository.findByIdAndCustomer_Id(orderId, customerId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        OrderWorkflowStatus currentStatus = resolveWorkflowStatus(order);
        if (currentStatus != OrderWorkflowStatus.WAIT && currentStatus != OrderWorkflowStatus.PREPARING) {
            throw new AppException(ErrorCode.ORDER_STATUS_INVALID_TRANSITION);
        }

        List<OrderItem> updatedItems = orderItemService.appendOrderItems(order, request.getOrderItems(), currentStatus);
        order.setOrderItems(updatedItems);
        order.setTotalPrice(orderItemService.calculateTotalPrice(updatedItems));
        orderRepository.save(order);
        return orderMapper.toOrderResponse(order);
    }

    public OrderResponse getOrderById(Integer orderId) {
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        log.info("Order with id {} retrieved successfully", orderId);
        return toResponseWithNormalizedStatus(order);
    }

    private OrderResponse toResponseWithNormalizedStatus(Order order) {
        if (order.getOrderStatus() == null) {
            order.setOrderStatus(OrderWorkflowStatus.WAIT);
        }
        return orderMapper.toOrderResponse(order);
    }

    private OrderWorkflowStatus resolveWorkflowStatus(Order order) {
        if (order.getOrderStatus() == null) {
            order.setOrderStatus(OrderWorkflowStatus.WAIT);
            return OrderWorkflowStatus.WAIT;
        }
        return order.getOrderStatus();
    }
}
