import type { POI, POIStatus } from '@/types'
import { apiFetch, type PagingResponse } from '@/lib/api'

interface PoiApiModel {
  id: number
  shopId?: number
  name: string
  description?: string
  address: string
  lat?: number
  lng?: number
  region?: string
  category?: string
  status: 'DRAFT' | 'PUBLISHED' | 'FLAGGED' | 'HIDDEN'
  ownerId?: number
  ownerName?: string
  coverImage?: string
  riskFlag: boolean
  riskScore?: number
  updatedAt: string
  createdAt: string
}

export interface PoiListParams {
  page: number
  size: number
  search?: string
  status?: POIStatus
  region?: string
  hasFlag?: boolean
}

export interface PoiUpsertPayload {
  shopId: number
  riskFlag?: boolean
  riskScore?: number
}

function mapStatus(status: PoiApiModel['status']): POIStatus {
  switch (status) {
    case 'DRAFT':
      return 'draft'
    case 'PUBLISHED':
      return 'published'
    case 'FLAGGED':
      return 'flagged'
    case 'HIDDEN':
      return 'hidden'
  }
}

function mapToApiStatus(status: POIStatus): PoiApiModel['status'] {
  switch (status) {
    case 'draft':
      return 'DRAFT'
    case 'published':
      return 'PUBLISHED'
    case 'flagged':
      return 'FLAGGED'
    case 'hidden':
      return 'HIDDEN'
  }
}

function mapPoi(api: PoiApiModel): POI {
  return {
    id: String(api.id),
    shopId: api.shopId != null ? String(api.shopId) : undefined,
    name: api.name,
    description: api.description ?? undefined,
    address: api.address ?? undefined,
    lat: api.lat ?? undefined,
    lng: api.lng ?? undefined,
    region: api.region ?? undefined,
    category: api.category ?? undefined,
    status: mapStatus(api.status),
    ownerId: api.ownerId != null ? String(api.ownerId) : undefined,
    ownerName: api.ownerName ?? undefined,
    coverImage: api.coverImage,
    riskFlag: Boolean(api.riskFlag),
    riskScore: api.riskScore,
    updatedAt: api.updatedAt,
    createdAt: api.createdAt,
  }
}

export async function fetchPois(params: PoiListParams): Promise<PagingResponse<POI>> {
  const query = new URLSearchParams()
  query.set('page', String(params.page))
  query.set('size', String(params.size))
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', mapToApiStatus(params.status))
  if (params.region) query.set('region', params.region)
  if (typeof params.hasFlag === 'boolean') query.set('hasFlag', String(params.hasFlag))

  const result = await apiFetch<PagingResponse<PoiApiModel>>(`/poi?${query.toString()}`)
  return {
    ...result,
    items: result.items.map(mapPoi),
  }
}

export async function fetchPoiById(id: string): Promise<POI> {
  const poi = await apiFetch<PoiApiModel>(`/poi/${id}`)
  return mapPoi(poi)
}

export async function createPoi(payload: PoiUpsertPayload): Promise<POI> {
  const poi = await apiFetch<PoiApiModel>('/poi', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return mapPoi(poi)
}

export async function updatePoi(id: string, payload: PoiUpsertPayload): Promise<POI> {
  const poi = await apiFetch<PoiApiModel>(`/poi/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return mapPoi(poi)
}

export async function updatePoiStatus(id: string, status: POIStatus): Promise<POI> {
  const poi = await apiFetch<PoiApiModel>(`/poi/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: mapToApiStatus(status) }),
  })
  return mapPoi(poi)
}

export async function deletePoi(id: string): Promise<void> {
  await apiFetch<void>(`/poi/${id}`, { method: 'DELETE' })
}
