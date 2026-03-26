import type { POIStatus } from '@/types'

export const POI_MAP_ICON_CONFIG_SETTING_KEY = 'poi_map_icon_config_v1'
export const POI_MAP_CATEGORY_ICON_CONFIG_SETTING_KEY = 'poi_map_category_icon_config_v1'

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

export type PoiCategoryKey = 'hai_san' | 'lau' | 'do_nuong' | 'com' | 'pho' | 'giai_khat'

export const POI_CATEGORY_KEYS: PoiCategoryKey[] = [
  'hai_san',
  'lau',
  'do_nuong',
  'com',
  'pho',
  'giai_khat',
]

export const POI_CATEGORY_META: Record<
  PoiCategoryKey,
  { label: string; color: string; emoji: string; keywords: string[] }
> = {
  hai_san: {
    label: 'Hải sản',
    color: '#0ea5e9',
    emoji: '🦐',
    keywords: ['hai san', 'seafood', 'oc', 'muc', 'cua', 'ca', 'tom'],
  },
  lau: {
    label: 'Lẩu',
    color: '#f59e0b',
    emoji: '🍲',
    keywords: ['lau', 'hot pot', 'hotpot', 'bo lau'],
  },
  do_nuong: {
    label: 'Đồ nướng',
    color: '#ef4444',
    emoji: '🔥',
    keywords: ['do nuong', 'nuong', 'bbq', 'grill'],
  },
  com: {
    label: 'Cơm',
    color: '#f97316',
    emoji: '🍛',
    keywords: ['com', 'rice'],
  },
  pho: {
    label: 'Phở',
    color: '#8b5cf6',
    emoji: '🍜',
    keywords: ['noodle', 'bun', 'pho', 'mi', 'hu tieu'],
  },
  giai_khat: {
    label: 'Giải khát',
    color: '#2563eb',
    emoji: '🥤',
    keywords: ['giai khat', 'beverage', 'drink', 'coffee', 'ca phe', 'tra sua', 'sinzien'],
  },
}

export type PoiMapCategoryIconConfig = Record<PoiCategoryKey, string | null>

export const POI_CATEGORY_DEFAULT_ICON_URL: Record<PoiCategoryKey, string> = {
  hai_san: '/images/poi-categories/seafood.png',
  lau: '/images/poi-categories/hot-pot.png',
  do_nuong: '/images/poi-categories/bacon.png',
  com: '/images/poi-categories/rice.png',
  pho: '/images/poi-categories/noodles.png',
  giai_khat: '/images/poi-categories/tea.png',
}

export function createDefaultPoiMapIconConfig(): PoiMapIconConfig {
  return {
    draft: null,
    published: null,
    flagged: null,
    hidden: null,
  }
}

export function createDefaultPoiCategoryIconConfig(): PoiMapCategoryIconConfig {
  return {
    hai_san: null,
    lau: null,
    do_nuong: null,
    com: null,
    pho: null,
    giai_khat: null,
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

export function normalizePoiCategoryIconConfig(input: unknown): PoiMapCategoryIconConfig {
  const base = createDefaultPoiCategoryIconConfig()
  if (!input || typeof input !== 'object') {
    return base
  }

  const value = input as Record<string, unknown>
  const legacyKeyFallback: Record<PoiCategoryKey, string[]> = {
    hai_san: [],
    lau: ['hot_pot'],
    do_nuong: ['nuong'],
    com: [],
    pho: ['noodle'],
    giai_khat: [],
  }

  for (const category of POI_CATEGORY_KEYS) {
    const candidates = [value[category], ...legacyKeyFallback[category].map((legacyKey) => value[legacyKey])]
    const entry = candidates.find((item) => typeof item === 'string')
    if (typeof entry === 'string' && isImageDataUrl(entry)) {
      base[category] = entry
    } else {
      base[category] = null
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

export function parsePoiCategoryIconConfig(rawValue?: string | null): PoiMapCategoryIconConfig {
  if (!rawValue) {
    return createDefaultPoiCategoryIconConfig()
  }
  try {
    const parsed = JSON.parse(rawValue) as unknown
    return normalizePoiCategoryIconConfig(parsed)
  } catch {
    return createDefaultPoiCategoryIconConfig()
  }
}

export function serializePoiMapIconConfig(config: PoiMapIconConfig): string {
  return JSON.stringify(normalizePoiMapIconConfig(config))
}

export function serializePoiCategoryIconConfig(config: PoiMapCategoryIconConfig): string {
  return JSON.stringify(normalizePoiCategoryIconConfig(config))
}

export function resolvePoiCategoryKey(
  ...candidates: Array<string | null | undefined>
): PoiCategoryKey | null {
  const normalizedCandidates = candidates
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => normalizeForMatching(value))

  if (!normalizedCandidates.length) {
    return null
  }

  for (const category of POI_CATEGORY_KEYS) {
    const keywords = POI_CATEGORY_META[category].keywords
    const hasMatch = normalizedCandidates.some((candidate) =>
      keywords.some((keyword) => candidate.includes(keyword))
    )

    if (hasMatch) {
      return category
    }
  }

  return null
}

function normalizeForMatching(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}
