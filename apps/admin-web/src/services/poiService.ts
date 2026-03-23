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
  qrCode?: string
  riskFlag: boolean
  riskScore?: number
  updatedAt: string
  createdAt: string
}

interface PoiMenuItemApiModel {
  id: number
  name: string
  descriptionText?: string
  price?: number
  rating?: number
  moderationStatus?: string
  isSignature?: boolean
  imageUrl?: string
  audioScriptText?: string
  riskScore?: number
  riskFlags?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

interface PoiModerationLogApiModel {
  id: number
  menuItemId?: number
  fieldName: string
  textSnapshot?: string
  riskScore?: number
  labels?: string
  matchedTerms?: string
  suggestedRewrite?: string
  modelVersion?: string
  status?: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt?: string
}

interface PoiApprovalHistoryItemApiModel {
  id: number
  shopId: number
  poiId?: number
  status: string
  submittedAt: string
  reviewer?: string
  reviewedAt?: string
  reason?: string
}

interface PoiDetailApiModel {
  poi: PoiApiModel
  menuItems: PoiMenuItemApiModel[]
  moderationLogs: PoiModerationLogApiModel[]
  approvalHistory: PoiApprovalHistoryItemApiModel[]
}

export interface PoiMenuItemDetail {
  id: string
  name: string
  descriptionText?: string
  price?: number
  rating?: number
  moderationStatus?: string
  status?: string
}

export interface PoiModerationLogDetail {
  id: string
  menuItemId?: string
  fieldName: string
  status?: string
  riskScore?: number
  createdAt?: string
}

export interface PoiApprovalHistoryItemDetail {
  id: string
  status: string
  submittedAt: string
  reviewer?: string
}

export interface PoiDetail {
  poi: POI
  menuItems: PoiMenuItemDetail[]
  moderationLogs: PoiModerationLogDetail[]
  approvalHistory: PoiApprovalHistoryItemDetail[]
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
    qrCode: api.qrCode ?? undefined,
    riskFlag: Boolean(api.riskFlag),
    riskScore: api.riskScore,
    updatedAt: api.updatedAt,
    createdAt: api.createdAt,
  }
}

function mapPoiMenuItem(api: PoiMenuItemApiModel): PoiMenuItemDetail {
  return {
    id: String(api.id),
    name: api.name,
    descriptionText: api.descriptionText ?? undefined,
    price: api.price ?? undefined,
    rating: api.rating ?? undefined,
    moderationStatus: api.moderationStatus ?? undefined,
    status: api.status ?? undefined,
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

export async function fetchPoiDetailById(id: string): Promise<PoiDetail> {
  const detail = await apiFetch<PoiDetailApiModel>(`/poi/${id}/detail`)
  return {
    poi: mapPoi(detail.poi),
    menuItems: detail.menuItems.map(mapPoiMenuItem),
    moderationLogs: detail.moderationLogs.map((item) => ({
      id: String(item.id),
      menuItemId: item.menuItemId != null ? String(item.menuItemId) : undefined,
      fieldName: item.fieldName,
      status: item.status ?? undefined,
      riskScore: item.riskScore ?? undefined,
      createdAt: item.createdAt ?? undefined,
    })),
    approvalHistory: detail.approvalHistory.map((item) => ({
      id: String(item.id),
      status: item.status,
      submittedAt: item.submittedAt,
      reviewer: item.reviewer ?? undefined,
    })),
  }
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
