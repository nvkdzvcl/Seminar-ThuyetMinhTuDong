import { apiFetch } from "@/lib/api"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/vinhkhanhfoodtour/api"

export interface NarrationItem {
  language: string
  languageKey?: string
  requestedLanguage?: string
  voice?: string
  sourceText?: string
  script?: string
  audioUrl?: string
  cached?: boolean
  fallbackApplied?: boolean
  updatedAt?: string
}

export interface ShopNarrationItem extends NarrationItem {
  shopId: number
}

export interface DishNarrationItem extends NarrationItem {
  dishId: number
  shopId?: number
}

export interface GenerateNarrationPayload {
  lang: string
  description: string
}

export function listShopNarrations(shopId: number): Promise<ShopNarrationItem[]> {
  return apiFetch<ShopNarrationItem[]>(`/shop/${shopId}/narrations`)
}

export function generateShopNarration(
  shopId: number,
  payload: GenerateNarrationPayload,
): Promise<ShopNarrationItem> {
  return apiFetch<ShopNarrationItem>(`/shop/${shopId}/narration`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function listDishNarrations(dishId: number): Promise<DishNarrationItem[]> {
  return apiFetch<DishNarrationItem[]>(`/dish/${dishId}/narrations`)
}

export function generateDishNarration(
  dishId: number,
  payload: GenerateNarrationPayload,
): Promise<DishNarrationItem> {
  return apiFetch<DishNarrationItem>(`/dish/${dishId}/narration`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function resolveNarrationAudioUrl(audioUrl?: string | null): string | null {
  if (!audioUrl?.trim()) {
    return null
  }
  const normalized = audioUrl.trim()
  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("blob:") ||
    normalized.startsWith("data:")
  ) {
    return normalized
  }
  const base = API_BASE_URL.replace(/\/+$/, "")
  const path = normalized.startsWith("/") ? normalized : `/${normalized}`
  return `${base}${path}`
}

