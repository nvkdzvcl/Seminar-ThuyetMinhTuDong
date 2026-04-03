import { apiFetch } from "@/lib/api"

export type OrderWorkflowStatus =
  | "WAIT"
  | "PREPARING"
  | "COMPLETED"
  | "CUSTOMER_CANCELLED"
  | "SHOP_CANCELLED"

export interface OwnerOrderItem {
  id: number
  orderId: number
  dishId: number
  dishName: string
  quantity: number
  pricePerUnit: number
  status: string
}

export interface OwnerOrder {
  id: number
  shopId: number
  shopName: string
  customerId?: number
  customerName?: string
  totalPrice: number
  paymentMethod?: string
  createdAt: string
  paymentStatus?: string
  status?: string
  orderStatus: OrderWorkflowStatus
  orderItems: OwnerOrderItem[]
}

export function getOrdersForShopOwner(): Promise<OwnerOrder[]> {
  return apiFetch<OwnerOrder[]>("/order/shop-owner")
}

export function confirmOrder(orderId: number): Promise<OwnerOrder> {
  return apiFetch<OwnerOrder>(`/order/${orderId}/confirm`, {
    method: "PATCH",
  })
}

export function completeOrder(orderId: number): Promise<OwnerOrder> {
  return apiFetch<OwnerOrder>(`/order/${orderId}/complete`, {
    method: "PATCH",
  })
}

export function cancelOrderByShop(orderId: number): Promise<OwnerOrder> {
  return apiFetch<OwnerOrder>(`/order/${orderId}/cancel-shop`, {
    method: "PATCH",
  })
}
