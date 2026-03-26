import type { POIStatus } from '@/types'

export const POI_MAP_ICON_CONFIG_SETTING_KEY = 'poi_map_icon_config_v1'

export type PoiMapIconConfig = Record<POIStatus, string | null>

export const POI_STATUS_META: Record<
  POIStatus,
  { label: string; color: string; emoji: string }
> = {
  draft: {
    label: 'Chờ duyệt',
    color: '#d97706',
    emoji: '⏳',
  },
  published: {
    label: 'Đã duyệt',
    color: '#059669',
    emoji: '✔',
  },
  flagged: {
    label: 'Từ chối',
    color: '#dc2626',
    emoji: '!',
  },
  hidden: {
    label: 'Đã ẩn',
    color: '#475569',
    emoji: '•',
  },
}

const POI_STATUSES: POIStatus[] = ['draft', 'published', 'flagged', 'hidden']

export function createDefaultPoiMapIconConfig(): PoiMapIconConfig {
  return {
    draft: null,
    published: null,
    flagged: null,
    hidden: null,
  }
}

function isImageDataUrl(value: string): boolean {
  return value.startsWith('data:image/')
}

export function normalizePoiMapIconConfig(input: unknown): PoiMapIconConfig {
  const base = createDefaultPoiMapIconConfig()
  if (!input || typeof input !== 'object') {
    return base
  }

  const value = input as Record<string, unknown>
  for (const status of POI_STATUSES) {
    const entry = value[status]
    if (typeof entry === 'string' && isImageDataUrl(entry)) {
      base[status] = entry
    } else {
      base[status] = null
    }
  }
  return base
}

export function parsePoiMapIconConfig(rawValue?: string | null): PoiMapIconConfig {
  if (!rawValue) {
    return createDefaultPoiMapIconConfig()
  }
  try {
    const parsed = JSON.parse(rawValue) as unknown
    return normalizePoiMapIconConfig(parsed)
  } catch {
    return createDefaultPoiMapIconConfig()
  }
}

export function serializePoiMapIconConfig(config: PoiMapIconConfig): string {
  return JSON.stringify(normalizePoiMapIconConfig(config))
}

