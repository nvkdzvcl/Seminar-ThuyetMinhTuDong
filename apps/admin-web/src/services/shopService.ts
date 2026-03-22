import { apiFetch, type PagingResponse } from '@/lib/api'

interface ShopApiModel {
  id: number
  name: string
}

export interface ShopOption {
  value: string
  label: string
}

export async function fetchShopOptions(): Promise<ShopOption[]> {
  const result = await apiFetch<PagingResponse<ShopApiModel>>('/shop?page=1&size=10&status=ACTIVE')
  return result.items.map((shop) => ({ value: String(shop.id), label: shop.name }))
}
