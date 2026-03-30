import { apiFetch, type PagingResponse } from '@/lib/api'
import type { User, UserRole, UserStatus } from '@/types'

interface AdminUserApiModel {
  id: number
  fullName?: string
  phoneNumber?: string
  email?: string
  role?: string
  status?: string
  createdAt?: string
}

interface FetchAdminUsersParams {
  page: number
  size: number
  search?: string
  role?: UserRole
  status?: UserStatus
}

export interface OwnerOption {
  value: string
  label: string
}

function toApiRole(role?: UserRole): string | undefined {
  if (!role) {
    return undefined
  }
  switch (role) {
    case 'super_admin':
      return 'SUPER_ADMIN'
    case 'admin':
      return 'ADMIN'
    case 'customer':
      return 'CUSTOMER'
    case 'store_owner':
      return 'OWNER_SHOP'
  }
}

function toApiStatus(status?: UserStatus): string | undefined {
  if (!status) {
    return undefined
  }
  switch (status) {
    case 'active':
      return 'ACTIVE'
    case 'suspended':
      return 'DELETED'
  }
}

function toUiRole(role?: string): UserRole {
  switch ((role || '').toUpperCase()) {
    case 'SUPER_ADMIN':
      return 'super_admin'
    case 'ADMIN':
      return 'admin'
    case 'OWNER_SHOP':
      return 'store_owner'
    default:
      return 'customer'
  }
}

function toUiStatus(status?: string): UserStatus {
  return (status || '').toUpperCase() === 'ACTIVE' ? 'active' : 'suspended'
}

function mapAdminUser(api: AdminUserApiModel): User {
  return {
    id: String(api.id),
    name: api.fullName?.trim() || 'Unknown',
    email: api.email?.trim() || '--',
    phoneNumber: api.phoneNumber?.trim() || '--',
    role: toUiRole(api.role),
    status: toUiStatus(api.status),
    createdAt: api.createdAt?.trim() || new Date().toISOString(),
    avatar: undefined,
    lastActivity: undefined,
  }
}

export async function fetchAdminUsers(
  params: FetchAdminUsersParams
): Promise<PagingResponse<User>> {
  const query = new URLSearchParams()
  query.set('page', String(params.page))
  query.set('size', String(params.size))
  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  const apiRole = toApiRole(params.role)
  if (apiRole) {
    query.set('role', apiRole)
  }

  const apiStatus = toApiStatus(params.status)
  if (apiStatus) {
    query.set('status', apiStatus)
  }

  const result = await apiFetch<PagingResponse<AdminUserApiModel>>(`/admin/users?${query.toString()}`)
  return {
    ...result,
    items: result.items.map(mapAdminUser),
  }
}

export async function updateAdminUserRole(id: string, role: UserRole): Promise<User> {
  const result = await apiFetch<AdminUserApiModel>(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role: toApiRole(role) }),
  })
  return mapAdminUser(result)
}

export async function updateAdminUserStatus(id: string, status: UserStatus): Promise<User> {
  const result = await apiFetch<AdminUserApiModel>(`/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: toApiStatus(status) }),
  })
  return mapAdminUser(result)
}

export async function fetchOwnerOptions(): Promise<OwnerOption[]> {
  const allOwners: User[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const result = await fetchAdminUsers({
      page,
      size: 100,
      role: 'store_owner',
    })
    allOwners.push(...result.items)
    totalPages = Math.max(result.totalPages || 1, 1)
    page += 1
  }

  return allOwners.map((user) => ({
    value: user.id,
    label: user.name,
  }))
}
