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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/vinhkhanhfoodtour/api"
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return ""
  }
})()

function toAbsoluteUrl(path: string): string {
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path
  }

  if (path.startsWith("/uploads/")) {
    return `${API_BASE_URL}${path}`
  }

  if (path.startsWith("uploads/")) {
    return `${API_BASE_URL}/${path}`
  }

  if (path.startsWith("/")) {
    return API_ORIGIN ? `${API_ORIGIN}${path}` : path
  }

  return `${API_BASE_URL}/uploads/dish-images/${encodeURIComponent(path)}`
}

export function resolveDishImageUrl(image?: string | null): string | null {
  if (!image?.trim()) return null
  return toAbsoluteUrl(image.trim())
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

export function uploadDishImage(dishId: number, file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  return apiFetch<string>(`/dish/${dishId}/image`, {
    method: "POST",
    body: formData,
  })
}

export function deleteDish(dishId: number): Promise<void> {
  return apiFetch<void>(`/dish/${dishId}`, {
    method: "DELETE",
  })
}
