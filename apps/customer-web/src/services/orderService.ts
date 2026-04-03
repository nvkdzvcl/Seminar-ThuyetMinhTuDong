import axiosClient from "./axiosClient";
import type { ApiResponse } from "../types/api";

export type OrderWorkflowStatus =
    | "WAIT"
    | "PREPARING"
    | "COMPLETED"
    | "CUSTOMER_CANCELLED"
    | "SHOP_CANCELLED";

export type OrderItemPayload = {
    dishId: number;
    quantity: number;
};

export type CreateOrderPayload = {
    shopId: number;
    orderItems: OrderItemPayload[];
};

export type AddOrderItemsPayload = {
    orderItems: OrderItemPayload[];
};

export type OrderItemResponse = {
    id: number;
    orderId: number;
    dishId: number;
    dishName: string;
    quantity: number;
    pricePerUnit: number;
    status: string;
};

export type OrderResponse = {
    id: number;
    shopId: number;
    shopName: string;
    customerId?: number;
    customerName?: string;
    totalPrice: number;
    paymentMethod: string;
    createdAt: string;
    paymentStatus: string;
    status: string;
    orderStatus: OrderWorkflowStatus;
    orderItems: OrderItemResponse[];
};

export const orderService = {
    createOrder: async (payload: CreateOrderPayload) => {
        const res = await axiosClient.post<ApiResponse<OrderResponse>>("/order/create", payload);
        return res.data;
    },

    getMyOrders: async () => {
        const res = await axiosClient.get<ApiResponse<OrderResponse[]>>("/order/my");
        return res.data;
    },

    cancelByCustomer: async (orderId: number) => {
        const res = await axiosClient.patch<ApiResponse<OrderResponse>>(
            `/order/${orderId}/cancel-customer`
        );
        return res.data;
    },

    addItemsByCustomer: async (orderId: number, payload: AddOrderItemsPayload) => {
        const res = await axiosClient.patch<ApiResponse<OrderResponse>>(
            `/order/${orderId}/add-items`,
            payload
        );
        return res.data;
    },
};
