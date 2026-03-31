import { apiFetch, type PagingResponse } from '@/lib/api'

interface AdminAuditLogApiModel {
  id: number
  actorId?: number | null
  actorEmail?: string | null
  actorRole?: string | null
  action?: string | null
  method?: string | null
  path?: string | null
  statusCode?: number | null
  ipAddress?: string | null
  userAgent?: string | null
  detail?: string | null
  createdAt?: string | null
}

export type AuditLogUiModule = 'poi' | 'user' | 'job' | 'settings' | 'system'
export type AuditLogUiAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'login'
  | 'logout'
  | 'read'

export interface AdminAuditLogItem {
  id: string
  timestamp: string
  actor: string
  actorId: string
  actorRole?: string
  module: AuditLogUiModule
  action: AuditLogUiAction
  method: string
  path: string
  statusCode?: number
  ipAddress?: string
  userAgent?: string
  detail?: string
}

interface FetchAdminAuditLogsParams {
  page: number
  size: number
}

interface FetchAllAdminAuditLogsOptions {
  pageSize?: number
  maxPages?: number
}

function deriveModule(path?: string | null): AuditLogUiModule {
  const value = (path ?? '').toLowerCase()
  if (value.includes('/admin/pois')) return 'poi'
  if (value.includes('/admin/users')) return 'user'
  if (value.includes('/admin/jobs')) return 'job'
  if (value.includes('/admin/settings')) return 'settings'
  return 'system'
}

function deriveAction(log: AdminAuditLogApiModel): AuditLogUiAction {
  const action = (log.action ?? '').toLowerCase()
  const path = (log.path ?? '').toLowerCase()
  const method = (log.method ?? '').toUpperCase()

  if (action === 'login' || path.endsWith('/login')) return 'login'
  if (action === 'logout' || path.endsWith('/logout')) return 'logout'
  if (path.includes('/status') || path.includes('/approve') || path.includes('/reject')) {
    return 'status_change'
  }

  if (method === 'POST') return 'create'
  if (method === 'PUT' || method === 'PATCH') return 'update'
  if (method === 'DELETE') return 'delete'
  return 'read'
}

function mapAuditLog(api: AdminAuditLogApiModel): AdminAuditLogItem {
  const actorEmail = api.actorEmail?.trim()
  const actorId = api.actorId != null ? String(api.actorId) : 'system'
  return {
    id: String(api.id),
    timestamp: api.createdAt ?? new Date().toISOString(),
    actor: actorEmail || (api.actorId != null ? `User #${api.actorId}` : 'System'),
    actorId,
    actorRole: api.actorRole ?? undefined,
    module: deriveModule(api.path),
    action: deriveAction(api),
    method: (api.method ?? '').toUpperCase() || 'UNKNOWN',
    path: api.path ?? '--',
    statusCode: api.statusCode ?? undefined,
    ipAddress: api.ipAddress ?? undefined,
    userAgent: api.userAgent ?? undefined,
    detail: api.detail ?? undefined,
  }
}

export async function fetchAdminAuditLogs(
  params: FetchAdminAuditLogsParams
): Promise<PagingResponse<AdminAuditLogItem>> {
  const query = new URLSearchParams()
  query.set('page', String(params.page))
  query.set('size', String(params.size))

  const result = await apiFetch<PagingResponse<AdminAuditLogApiModel>>(
    `/admin/audit-logs?${query.toString()}`
  )
  return {
    ...result,
    items: result.items.map(mapAuditLog),
  }
}

export async function fetchAllAdminAuditLogs(
  options?: FetchAllAdminAuditLogsOptions
): Promise<AdminAuditLogItem[]> {
  const pageSize = Math.max(1, Math.min(options?.pageSize ?? 100, 200))
  const maxPages = Math.max(1, options?.maxPages ?? 50)

  const collected: AdminAuditLogItem[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages && page <= maxPages) {
    const result = await fetchAdminAuditLogs({ page, size: pageSize })
    collected.push(...result.items)
    totalPages = Math.max(result.totalPages || 1, 1)
    page += 1
  }

  return collected
}
