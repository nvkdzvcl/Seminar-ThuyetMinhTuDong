import { apiFetch } from "@/lib/api"

export type DishStatus = "ACTIVE" | "DELETED"

export interface Dish {
  id: number
  shopId: number
  name: string
  description?: string
  type?: string
  price: number
  isSignature: boolean
  image?: string
  createdAt?: string
  status?: DishStatus
}

export interface PagingDto<T> {
  items: T[]
  totalItems: number
  currentPage: number
  pageSize: number
  totalPages: number
}

export interface CreateDishPayload {
  shopId: number
  name: string
  description?: string
  price: number
  isSignature: boolean
}

export interface UpdateDishPayload {
  name?: string
  description?: string
  type?: string
  price?: number
  isSignature?: boolean
}

interface ListDishOptions {
  status?: DishStatus
  page?: number
  size?: number
}

export function getDishesByShopId(
  shopId: number,
  options?: ListDishOptions,
): Promise<PagingDto<Dish>> {
  const status = options?.status ?? "ACTIVE"
  const page = options?.page ?? 1
  const size = options?.size ?? 100
  const query = `status=${status}&page=${page}&size=${size}`
  return apiFetch<PagingDto<Dish>>(`/dish/shop/${shopId}?${query}`)
}

export function getDishById(dishId: number): Promise<Dish> {
  return apiFetch<Dish>(`/dish/${dishId}`)
}

export function createDish(payload: CreateDishPayload): Promise<Dish> {
  return apiFetch<Dish>("/dish/create", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateDish(dishId: number, payload: UpdateDishPayload): Promise<Dish> {
  return apiFetch<Dish>(`/dish/${dishId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function deleteDish(dishId: number): Promise<void> {
  return apiFetch<void>(`/dish/${dishId}`, {
    method: "DELETE",
  })
}
