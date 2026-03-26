import { apiFetch } from '@/lib/api'

export interface AdminSetting {
  key: string
  value: string
  updatedAt?: string
}

export interface AdminSettingUpsertPayload {
  key: string
  value: string
}

export async function fetchAdminSettings(): Promise<AdminSetting[]> {
  return apiFetch<AdminSetting[]>('/admin/settings')
}

export async function upsertAdminSettings(
  payload: AdminSettingUpsertPayload[]
): Promise<AdminSetting[]> {
  return apiFetch<AdminSetting[]>('/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

