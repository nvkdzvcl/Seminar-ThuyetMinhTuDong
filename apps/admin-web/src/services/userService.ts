import { apiFetch, type PagingResponse } from '@/lib/api'

interface UserApiModel {
  id: number
  fullName: string
  role: string
}

export interface OwnerOption {
  value: string
  label: string
}

export async function fetchOwnerOptions(): Promise<OwnerOption[]> {
  const result = await apiFetch<PagingResponse<UserApiModel>>('/user?page=1&size=10')
  return result.items
    .filter((user) => user.role === 'OWNER_SHOP' || user.role === 'ADMIN')
    .map((user) => ({ value: String(user.id), label: user.fullName }))
}
