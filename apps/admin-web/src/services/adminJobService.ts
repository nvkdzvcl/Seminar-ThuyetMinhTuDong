import { apiFetch, type PagingResponse } from '@/lib/api'
import type { Job, JobStatus, JobType } from '@/types'

interface AdminJobApiModel {
  id: number
  jobCode?: string | null
  type?: 'AUDIO_GENERATION' | 'CONTENT_MODERATION' | 'IMAGE_PROCESSING' | 'DATA_SYNC' | null
  status?: 'QUEUED' | 'PROCESSING' | 'FAILED' | 'DONE' | 'CANCELED' | null
  relatedPoiId?: number | null
  relatedUserId?: number | null
  retryCount?: number | null
  errorMessage?: string | null
  createdAt?: string | null
  startedAt?: string | null
  endedAt?: string | null
}

interface AdminJobSummaryApiModel {
  total: number
  queued: number
  processing: number
  failed: number
  done: number
  canceled: number
}

export interface AdminJob extends Job {
  backendId: number
}

interface FetchAdminJobsParams {
  page: number
  size: number
  search?: string
  status?: JobStatus
  type?: JobType
}

export interface AdminJobsSummary {
  total: number
  queued: number
  processing: number
  failed: number
  done: number
  canceled: number
}

function toApiStatus(status?: JobStatus): string | undefined {
  if (!status) return undefined
  switch (status) {
    case 'queued':
      return 'QUEUED'
    case 'processing':
      return 'PROCESSING'
    case 'failed':
      return 'FAILED'
    case 'done':
      return 'DONE'
    case 'canceled':
      return 'CANCELED'
  }
}

function toApiType(type?: JobType): string | undefined {
  if (!type) return undefined
  switch (type) {
    case 'audio_generation':
      return 'AUDIO_GENERATION'
    case 'content_moderation':
      return 'CONTENT_MODERATION'
    case 'image_processing':
      return 'IMAGE_PROCESSING'
    case 'data_sync':
      return 'DATA_SYNC'
  }
}

function toUiType(type?: AdminJobApiModel['type']): JobType {
  switch ((type ?? '').toUpperCase()) {
    case 'AUDIO_GENERATION':
      return 'audio_generation'
    case 'CONTENT_MODERATION':
      return 'content_moderation'
    case 'IMAGE_PROCESSING':
      return 'image_processing'
    default:
      return 'data_sync'
  }
}

function toUiStatus(status?: AdminJobApiModel['status']): JobStatus {
  switch ((status ?? '').toUpperCase()) {
    case 'QUEUED':
      return 'queued'
    case 'PROCESSING':
      return 'processing'
    case 'FAILED':
      return 'failed'
    case 'DONE':
      return 'done'
    case 'CANCELED':
      return 'canceled'
    default:
      return 'queued'
  }
}

function toRelatedPoi(value?: number | null): string | undefined {
  if (value == null) return undefined
  return `POI #${value}`
}

function toRelatedUser(value?: number | null): string | undefined {
  if (value == null) return undefined
  return `User #${value}`
}

function mapAdminJob(api: AdminJobApiModel): AdminJob {
  return {
    backendId: api.id,
    id: api.jobCode?.trim() || `JOB-${api.id}`,
    type: toUiType(api.type),
    status: toUiStatus(api.status),
    relatedPOI: toRelatedPoi(api.relatedPoiId),
    relatedUser: toRelatedUser(api.relatedUserId),
    retryCount: api.retryCount ?? 0,
    startedAt: api.startedAt ?? undefined,
    endedAt: api.endedAt ?? undefined,
    error: api.errorMessage ?? undefined,
    createdAt: api.createdAt ?? new Date().toISOString(),
  }
}

function toBackendJobId(job: AdminJob | number): number {
  return typeof job === 'number' ? job : job.backendId
}

export async function fetchAdminJobs(
  params: FetchAdminJobsParams
): Promise<PagingResponse<AdminJob>> {
  const query = new URLSearchParams()
  query.set('page', String(params.page))
  query.set('size', String(params.size))
  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  const status = toApiStatus(params.status)
  if (status) {
    query.set('status', status)
  }

  const type = toApiType(params.type)
  if (type) {
    query.set('type', type)
  }

  const result = await apiFetch<PagingResponse<AdminJobApiModel>>(`/admin/jobs?${query.toString()}`)
  return {
    ...result,
    items: result.items.map(mapAdminJob),
  }
}

export async function fetchAdminJobsSummary(): Promise<AdminJobsSummary> {
  const result = await apiFetch<AdminJobSummaryApiModel>('/admin/jobs/summary')
  return {
    total: result.total ?? 0,
    queued: result.queued ?? 0,
    processing: result.processing ?? 0,
    failed: result.failed ?? 0,
    done: result.done ?? 0,
    canceled: result.canceled ?? 0,
  }
}

export async function fetchAdminJobById(id: number): Promise<AdminJob> {
  const result = await apiFetch<AdminJobApiModel>(`/admin/jobs/${id}`)
  return mapAdminJob(result)
}

export async function retryAdminJob(job: AdminJob | number): Promise<AdminJob> {
  const id = toBackendJobId(job)
  const result = await apiFetch<AdminJobApiModel>(`/admin/jobs/${id}/retry`, {
    method: 'POST',
  })
  return mapAdminJob(result)
}

export async function cancelAdminJob(job: AdminJob | number): Promise<AdminJob> {
  const id = toBackendJobId(job)
  const result = await apiFetch<AdminJobApiModel>(`/admin/jobs/${id}/cancel`, {
    method: 'PATCH',
  })
  return mapAdminJob(result)
}
