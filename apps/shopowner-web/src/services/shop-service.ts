import { apiFetch } from "@/lib/api"

export interface OwnerShop {
  id: number
  ownerId: string
  name: string
  address: string
  description: string
  imageName?: string
  audioURL?: string
  lat?: number
  lng?: number
  avgCostPerPerson?: number
  avgWaitTimeMin?: number
  avgEatTimeMin?: number
  createdAt?: string
  status?: string
}

export interface UpdateMyShopPayload {
  name?: string
  address?: string
  description?: string
  lat?: number
  lng?: number
  avgCostPerPerson?: number
  avgWaitTimeMin?: number
  avgEatTimeMin?: number
}

export interface CreateShopPayload {
  name: string
  address: string
  description: string
  lat: number
  lng: number
  avgCostPerPerson: number
  avgWaitTimeMin: number
  avgEatTimeMin: number
  shopTypeId?: number
}

export function getMyShop(): Promise<OwnerShop> {
  return apiFetch<OwnerShop>("/shop/me")
}

export function createShop(payload: CreateShopPayload): Promise<OwnerShop> {
  return apiFetch<OwnerShop>("/shop/create", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateMyShop(payload: UpdateMyShopPayload): Promise<OwnerShop> {
  return apiFetch<OwnerShop>("/shop/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}
