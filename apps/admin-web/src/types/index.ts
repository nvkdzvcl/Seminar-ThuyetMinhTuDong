// User Types
export type UserRole = 'super_admin' | 'admin' | 'customer' | 'store_owner'
export type UserStatus = 'active' | 'suspended'

export interface User {
  id: string
  name: string
  email: string
  phoneNumber: string
  role: UserRole
  status: UserStatus
  createdAt: string
  avatar?: string
  lastActivity?: string
}

// POI Types
export type POIStatus = 'draft' | 'published' | 'flagged' | 'hidden'

export interface POI {
  id: string
  shopId?: string
  name: string
  description?: string
  address?: string
  lat?: number
  lng?: number
  region?: string
  category?: string
  status: POIStatus
  ownerId?: string
  ownerName?: string
  coverImage?: string
  qrCode?: string
  riskFlag: boolean
  riskScore?: number
  updatedAt: string
  createdAt: string
}

export interface POIVersion {
  id: string
  poiId: string
  version: number
  content: string
  audioUrl?: string
  createdAt: string
  createdBy: string
}

export interface POIChangeLog {
  id: string
  poiId: string
  action: string
  actor: string
  timestamp: string
  before?: string
  after?: string
  reason?: string
}

// Job Types
export type JobStatus = 'queued' | 'processing' | 'failed' | 'done' | 'canceled'
export type JobType = 'audio_generation' | 'content_moderation' | 'image_processing' | 'data_sync'

export interface Job {
  id: string
  type: JobType
  status: JobStatus
  relatedPOI?: string
  relatedUser?: string
  retryCount: number
  startedAt?: string
  endedAt?: string
  error?: string
  createdAt: string
}

// Audit Log Types
export type AuditModule = 'poi' | 'user' | 'job' | 'system' | 'settings'
export type AuditAction = 'create' | 'update' | 'delete' | 'status_change' | 'login' | 'logout'

export interface AuditLog {
  id: string
  timestamp: string
  actor: string
  actorId: string
  module: AuditModule
  action: AuditAction
  entity: string
  entityId: string
  before?: string
  after?: string
  reason?: string
}

// Settings Types
export interface SystemSettings {
  timeout: number
  defaultLanguage: string
  uploadLimit: number
  riskScoreThresholdLow: number
  riskScoreThresholdHigh: number
}

// Dashboard Types
export interface KPIStat {
  label: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
}

export interface ChartDataPoint {
  date: string
  jobs: number
  success: number
  failed: number
}

export interface RegionStat {
  region: string
  poiCount: number
  percentage: number
}

export interface WeeklyVisitPoint {
  date: string
  visits: number
}

export interface Alert {
  id: string
  type: 'flagged_poi' | 'failed_job'
  title: string
  description: string
  timestamp: string
  severity: 'warning' | 'error'
}
