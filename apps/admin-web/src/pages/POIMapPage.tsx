import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { toast } from 'sonner'
import { MapPin, RefreshCw, Save, Upload, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/shared/EmptyState'
import { MANUAL_POI_SEEDS } from '@/data/manual-poi-seeds'
import type { POI, POIStatus } from '@/types'
import { fetchAllPois } from '@/services/poiService'
import { fetchAdminSettings, upsertAdminSettings } from '@/services/adminSettingsService'
import {
  POI_CATEGORY_DEFAULT_ICON_URL,
  POI_CATEGORY_KEYS,
  POI_CATEGORY_META,
  POI_MAP_CATEGORY_ICON_CONFIG_SETTING_KEY,
  POI_MAP_ICON_CONFIG_SETTING_KEY,
  POI_STATUS_META,
  createDefaultPoiCategoryIconConfig,
  createDefaultPoiMapIconConfig,
  parsePoiCategoryIconConfig,
  parsePoiMapIconConfig,
  resolvePoiCategoryKey,
  serializePoiCategoryIconConfig,
  serializePoiMapIconConfig,
  type PoiCategoryKey,
  type PoiMapCategoryIconConfig,
  type PoiMapIconConfig,
} from '@/lib/poi-map-config'

const FALLBACK_CENTER: [number, number] = [10.762622, 106.660172]
const MAX_ICON_FILE_SIZE_BYTES = 512 * 1024
const MAP_MARKER_SIZE = 30
const POI_STATUSES: POIStatus[] = ['draft', 'published', 'flagged', 'hidden']

type MappedPoi = POI & {
  lat: number
  lng: number
  source: 'api' | 'manual'
  categoryKey: PoiCategoryKey | null
}

function isValidCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

function toMappedPoi(poi: POI): MappedPoi | null {
  if (!isValidCoordinate(poi.lat, -90, 90) || !isValidCoordinate(poi.lng, -180, 180)) {
    return null
  }
  return {
    ...poi,
    lat: poi.lat,
    lng: poi.lng,
    source: 'api',
    categoryKey: resolvePoiCategoryKey(poi.category, poi.name, poi.description),
  }
}

function toMappedManualPoi(seed: (typeof MANUAL_POI_SEEDS)[number]): MappedPoi {
  const timestamp = new Date().toISOString()

  return {
    id: seed.id,
    name: seed.name,
    address: seed.address,
    lat: seed.lat,
    lng: seed.lng,
    category: seed.category,
    status: 'published',
    source: 'manual',
    categoryKey: seed.category,
    riskFlag: false,
    ownerName: 'Dữ liệu nhập tay',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function buildPoiIdentityKey(poi: Pick<MappedPoi, 'name' | 'lat' | 'lng'>): string {
  return `${normalizeText(poi.name)}|${poi.lat.toFixed(6)}|${poi.lng.toFixed(6)}`
}

function mergePois(apiPois: MappedPoi[], manualPois: MappedPoi[]): MappedPoi[] {
  const byIdentity = new Map<string, MappedPoi>()

  for (const poi of apiPois) {
    byIdentity.set(buildPoiIdentityKey(poi), poi)
  }
  for (const poi of manualPois) {
    const key = buildPoiIdentityKey(poi)
    if (!byIdentity.has(key)) {
      byIdentity.set(key, poi)
    }
  }

  return Array.from(byIdentity.values())
}

function buildDefaultMarkerIcon(color: string, emoji: string): L.DivIcon {
  const halfSize = Math.round(MAP_MARKER_SIZE / 2)
  return L.divIcon({
    className: 'poi-status-marker-wrapper',
    html: `<div class="poi-status-marker" style="--marker-color:${color}; --marker-size:${MAP_MARKER_SIZE}px;"><span>${emoji}</span></div>`,
    iconSize: [MAP_MARKER_SIZE, MAP_MARKER_SIZE],
    iconAnchor: [halfSize, halfSize],
    popupAnchor: [0, -Math.round(MAP_MARKER_SIZE * 0.45)],
  })
}

function buildDefaultStatusIcon(status: POIStatus): L.DivIcon {
  const meta = POI_STATUS_META[status]
  return buildDefaultMarkerIcon(meta.color, meta.emoji)
}

function buildDefaultCategoryIcon(category: PoiCategoryKey): L.DivIcon {
  const meta = POI_CATEGORY_META[category]
  return buildDefaultMarkerIcon(meta.color, meta.emoji)
}

function buildImageIcon(iconUrl: string): L.Icon {
  const halfSize = Math.round(MAP_MARKER_SIZE / 2)
  return L.icon({
    iconUrl,
    iconSize: [MAP_MARKER_SIZE, MAP_MARKER_SIZE],
    iconAnchor: [halfSize, halfSize],
    popupAnchor: [0, -Math.round(MAP_MARKER_SIZE * 0.45)],
    className: 'poi-upload-marker',
  })
}

function MapViewportController({ pois }: { pois: MappedPoi[] }) {
  const map = useMap()

  useEffect(() => {
    if (!pois.length) {
      map.setView(FALLBACK_CENTER, 14, { animate: false })
      return
    }

    const bounds = L.latLngBounds(pois.map((poi) => [poi.lat, poi.lng] as [number, number]))
    map.fitBounds(bounds.pad(0.2), { maxZoom: 16, animate: false })
  }, [map, pois])

  return null
}

function createEmptyCategoryCounts(): Record<PoiCategoryKey, number> {
  return POI_CATEGORY_KEYS.reduce(
    (accumulator, category) => {
      accumulator[category] = 0
      return accumulator
    },
    {} as Record<PoiCategoryKey, number>
  )
}

export function POIMapPage() {
  const navigate = useNavigate()

  const [pois, setPois] = useState<MappedPoi[]>([])
  const [search, setSearch] = useState('')
  const [statusFilters, setStatusFilters] = useState<Record<POIStatus, boolean>>({
    draft: true,
    published: true,
    flagged: true,
    hidden: true,
  })
  const [statusIconConfig, setStatusIconConfig] = useState<PoiMapIconConfig>(
    createDefaultPoiMapIconConfig()
  )
  const [savedStatusIconConfigSerialized, setSavedStatusIconConfigSerialized] = useState(
    serializePoiMapIconConfig(createDefaultPoiMapIconConfig())
  )
  const [categoryIconConfig, setCategoryIconConfig] = useState<PoiMapCategoryIconConfig>(
    createDefaultPoiCategoryIconConfig()
  )
  const [savedCategoryIconConfigSerialized, setSavedCategoryIconConfigSerialized] = useState(
    serializePoiCategoryIconConfig(createDefaultPoiCategoryIconConfig())
  )
  const [isLoadingPois, setIsLoadingPois] = useState(true)
  const [isLoadingIconConfig, setIsLoadingIconConfig] = useState(true)
  const [isSavingIconConfig, setIsSavingIconConfig] = useState(false)

  const loadPois = useCallback(async () => {
    setIsLoadingPois(true)
    try {
      const allPois = await fetchAllPois({ pageSize: 100, maxPages: 50 })
      const mappedApiPois = allPois.map(toMappedPoi).filter((item): item is MappedPoi => item !== null)
      const manualPois = MANUAL_POI_SEEDS.map(toMappedManualPoi)
      setPois(mergePois(mappedApiPois, manualPois))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không tải được dữ liệu POI cho bản đồ')
      setPois(MANUAL_POI_SEEDS.map(toMappedManualPoi))
    } finally {
      setIsLoadingPois(false)
    }
  }, [])

  const loadIconConfig = useCallback(async () => {
    setIsLoadingIconConfig(true)
    try {
      const settings = await fetchAdminSettings()

      const rawStatusSetting =
        settings.find((item) => item.key === POI_MAP_ICON_CONFIG_SETTING_KEY)?.value ?? null
      const parsedStatus = parsePoiMapIconConfig(rawStatusSetting)
      const serializedStatus = serializePoiMapIconConfig(parsedStatus)
      setStatusIconConfig(parsedStatus)
      setSavedStatusIconConfigSerialized(serializedStatus)

      const rawCategorySetting =
        settings.find((item) => item.key === POI_MAP_CATEGORY_ICON_CONFIG_SETTING_KEY)?.value ?? null
      const parsedCategory = parsePoiCategoryIconConfig(rawCategorySetting)
      const serializedCategory = serializePoiCategoryIconConfig(parsedCategory)
      setCategoryIconConfig(parsedCategory)
      setSavedCategoryIconConfigSerialized(serializedCategory)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không tải được cấu hình icon bản đồ')

      const statusFallback = createDefaultPoiMapIconConfig()
      const categoryFallback = createDefaultPoiCategoryIconConfig()

      setStatusIconConfig(statusFallback)
      setSavedStatusIconConfigSerialized(serializePoiMapIconConfig(statusFallback))
      setCategoryIconConfig(categoryFallback)
      setSavedCategoryIconConfigSerialized(serializePoiCategoryIconConfig(categoryFallback))
    } finally {
      setIsLoadingIconConfig(false)
    }
  }, [])

  useEffect(() => {
    void loadPois()
    void loadIconConfig()
  }, [loadIconConfig, loadPois])

  const statusMarkerIcons = useMemo<Record<POIStatus, L.Icon | L.DivIcon>>(
    () => ({
      draft: statusIconConfig.draft ? buildImageIcon(statusIconConfig.draft) : buildDefaultStatusIcon('draft'),
      published: statusIconConfig.published
        ? buildImageIcon(statusIconConfig.published)
        : buildDefaultStatusIcon('published'),
      flagged: statusIconConfig.flagged
        ? buildImageIcon(statusIconConfig.flagged)
        : buildDefaultStatusIcon('flagged'),
      hidden: statusIconConfig.hidden
        ? buildImageIcon(statusIconConfig.hidden)
        : buildDefaultStatusIcon('hidden'),
    }),
    [statusIconConfig]
  )

  const categoryMarkerIcons = useMemo<Record<PoiCategoryKey, L.Icon | L.DivIcon>>(() => {
    const icons = {} as Record<PoiCategoryKey, L.Icon | L.DivIcon>
    for (const category of POI_CATEGORY_KEYS) {
      const iconUrl = categoryIconConfig[category] ?? POI_CATEGORY_DEFAULT_ICON_URL[category]
      icons[category] = iconUrl ? buildImageIcon(iconUrl) : buildDefaultCategoryIcon(category)
    }
    return icons
  }, [categoryIconConfig])

  const filteredPois = useMemo(() => {
    const normalizedSearch = normalizeText(search)
    return pois.filter((poi) => {
      if (!statusFilters[poi.status]) {
        return false
      }
      if (!normalizedSearch) {
        return true
      }

      const categoryLabel = poi.categoryKey ? POI_CATEGORY_META[poi.categoryKey].label : ''
      const searchable = [poi.name, poi.address, poi.ownerName, poi.category, categoryLabel]
        .filter((item): item is string => Boolean(item))
        .map((item) => normalizeText(item))

      return searchable.some((item) => item.includes(normalizedSearch))
    })
  }, [pois, search, statusFilters])

  const statusCounts = useMemo(() => {
    return POI_STATUSES.reduce(
      (accumulator, status) => {
        accumulator[status] = pois.filter((poi) => poi.status === status).length
        return accumulator
      },
      { draft: 0, published: 0, flagged: 0, hidden: 0 } as Record<POIStatus, number>
    )
  }, [pois])

  const categoryCounts = useMemo(() => {
    const counts = createEmptyCategoryCounts()
    for (const poi of pois) {
      if (poi.categoryKey) {
        counts[poi.categoryKey] += 1
      }
    }
    return counts
  }, [pois])

  const hasUnsavedIconChanges = useMemo(() => {
    const hasStatusChanges =
      serializePoiMapIconConfig(statusIconConfig) !== savedStatusIconConfigSerialized
    const hasCategoryChanges =
      serializePoiCategoryIconConfig(categoryIconConfig) !== savedCategoryIconConfigSerialized

    return hasStatusChanges || hasCategoryChanges
  }, [
    categoryIconConfig,
    savedCategoryIconConfigSerialized,
    savedStatusIconConfigSerialized,
    statusIconConfig,
  ])

  const handleToggleStatusFilter = (status: POIStatus) => {
    setStatusFilters((current) => ({ ...current, [status]: !current[status] }))
  }

  const readIconFileAndApply = (
    file: File | null | undefined,
    onSuccess: (dataUrl: string) => void
  ) => {
    if (!file) {
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ file ảnh (PNG/JPG/SVG/WebP).')
      return
    }
    if (file.size > MAX_ICON_FILE_SIZE_BYTES) {
      toast.error('Icon quá lớn. Vui lòng chọn file nhỏ hơn 512KB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null
      if (!result || !result.startsWith('data:image/')) {
        toast.error('Không đọc được file icon.')
        return
      }
      onSuccess(result)
    }
    reader.readAsDataURL(file)
  }

  const handleStatusIconFileChange = (status: POIStatus, file?: File | null) => {
    readIconFileAndApply(file, (dataUrl) => {
      setStatusIconConfig((current) => ({ ...current, [status]: dataUrl }))
    })
  }

  const handleCategoryIconFileChange = (category: PoiCategoryKey, file?: File | null) => {
    readIconFileAndApply(file, (dataUrl) => {
      setCategoryIconConfig((current) => ({ ...current, [category]: dataUrl }))
    })
  }

  const handleResetStatusIcon = (status: POIStatus) => {
    setStatusIconConfig((current) => ({ ...current, [status]: null }))
  }

  const handleResetCategoryIcon = (category: PoiCategoryKey) => {
    setCategoryIconConfig((current) => ({ ...current, [category]: null }))
  }

  const handleSaveIconConfig = async () => {
    const serializedStatus = serializePoiMapIconConfig(statusIconConfig)
    const serializedCategory = serializePoiCategoryIconConfig(categoryIconConfig)

    setIsSavingIconConfig(true)
    try {
      await upsertAdminSettings([
        {
          key: POI_MAP_ICON_CONFIG_SETTING_KEY,
          value: serializedStatus,
        },
        {
          key: POI_MAP_CATEGORY_ICON_CONFIG_SETTING_KEY,
          value: serializedCategory,
        },
      ])
      setSavedStatusIconConfigSerialized(serializedStatus)
      setSavedCategoryIconConfigSerialized(serializedCategory)
      toast.success('Đã lưu cấu hình icon bản đồ POI.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lưu cấu hình icon thất bại')
    } finally {
      setIsSavingIconConfig(false)
    }
  }

  const handleResetAllIcons = () => {
    setStatusIconConfig(createDefaultPoiMapIconConfig())
    setCategoryIconConfig(createDefaultPoiCategoryIconConfig())
  }

  if (isLoadingPois && isLoadingIconConfig) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        Đang tải bản đồ POI...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Bản Đồ POI</h1>
        <p className="text-sm text-muted-foreground">
          Hiển thị POI theo vị trí. Marker ưu tiên icon theo loại quán, nếu không có sẽ fallback theo
          trạng thái.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên quán, địa chỉ, chủ quán, category..."
          />
          <Button variant="outline" onClick={() => void loadPois()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Tải lại POI
          </Button>
          <div className="flex items-center justify-end text-sm text-muted-foreground">
            {filteredPois.length}/{pois.length} POI
          </div>

          <div className="col-span-full flex flex-wrap gap-2">
            {POI_STATUSES.map((status) => {
              const meta = POI_STATUS_META[status]
              const isSelected = statusFilters[status]
              return (
                <button
                  key={status}
                  onClick={() => handleToggleStatusFilter(status)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                  type="button"
                >
                  {meta.label} ({statusCounts[status]})
                </button>
              )
            })}
          </div>

          <div className="col-span-full flex flex-wrap gap-2">
            {POI_CATEGORY_KEYS.map((category) => (
              <Badge key={category} variant="outline" className="gap-1">
                <span>{POI_CATEGORY_META[category].emoji}</span>
                <span>
                  {POI_CATEGORY_META[category].label}: {categoryCounts[category]}
                </span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {filteredPois.length === 0 ? (
              <div className="flex h-[62vh] min-h-[420px] items-center justify-center px-6">
                <EmptyState
                  icon={MapPin}
                  title="Không có POI để hiển thị"
                  description="Kiểm tra bộ lọc hoặc dữ liệu lat/lng của POI."
                />
              </div>
            ) : (
              <MapContainer
                center={FALLBACK_CENTER}
                zoom={14}
                scrollWheelZoom
                className="h-[62vh] min-h-[420px] w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapViewportController pois={filteredPois} />
                {filteredPois.map((poi) => {
                  const markerIcon = poi.categoryKey
                    ? categoryMarkerIcons[poi.categoryKey]
                    : statusMarkerIcons[poi.status]

                  return (
                    <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={markerIcon}>
                      <Popup>
                        <div className="space-y-2 text-sm">
                          <p className="text-base font-semibold">{poi.name}</p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="secondary">{POI_STATUS_META[poi.status].label}</Badge>
                            {poi.categoryKey ? (
                              <Badge variant="outline">{POI_CATEGORY_META[poi.categoryKey].label}</Badge>
                            ) : null}
                            {poi.source === 'manual' ? (
                              <Badge variant="outline">Nhập tay</Badge>
                            ) : null}
                          </div>
                          <p className="text-muted-foreground">{poi.address || 'Chưa có địa chỉ'}</p>
                          <p className="text-muted-foreground">Chủ quán: {poi.ownerName || 'N/A'}</p>

                          {poi.source === 'api' ? (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => navigate(`/poi/${poi.id}`)}
                            >
                              Xem chi tiết POI
                            </Button>
                          ) : (
                            <p className="rounded-md border border-dashed p-2 text-xs text-muted-foreground">
                              POI được thêm từ dữ liệu tay, chưa có bản ghi chi tiết trên backend.
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tùy chỉnh icon POI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Icon theo trạng thái</h3>
              {POI_STATUSES.map((status) => {
                const meta = POI_STATUS_META[status]
                const iconDataUrl = statusIconConfig[status]
                return (
                  <div key={status} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{meta.label}</p>
                      <Badge variant="outline">{statusCounts[status]} POI</Badge>
                    </div>

                    <div className="mb-3 flex items-center gap-3">
                      {iconDataUrl ? (
                        <img
                          src={iconDataUrl}
                          alt={`Icon ${meta.label}`}
                          className="h-10 w-10 rounded-md border object-contain p-1"
                        />
                      ) : (
                        <div
                          className="poi-status-marker preview"
                          style={{ ['--marker-color' as string]: meta.color }}
                        >
                          <span>{meta.emoji}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {iconDataUrl ? 'Đang dùng icon upload tùy chỉnh' : 'Đang dùng icon mặc định'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`status-icon-upload-${status}`} className="text-xs">
                        Upload icon (PNG/JPG/SVG/WebP, tối đa 512KB)
                      </Label>
                      <Input
                        id={`status-icon-upload-${status}`}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={(event) => handleStatusIconFileChange(status, event.target.files?.[0])}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => handleResetStatusIcon(status)}
                        disabled={!iconDataUrl}
                      >
                        <X className="h-4 w-4" />
                        Trả về icon mặc định
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Icon theo loại quán</h3>
              {POI_CATEGORY_KEYS.map((category) => {
                const meta = POI_CATEGORY_META[category]
                const iconDataUrl = categoryIconConfig[category]
                const previewIconUrl = iconDataUrl ?? POI_CATEGORY_DEFAULT_ICON_URL[category]
                return (
                  <div key={category} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{meta.label}</p>
                      <Badge variant="outline">{categoryCounts[category]} POI</Badge>
                    </div>

                    <div className="mb-3 flex items-center gap-3">
                      {previewIconUrl ? (
                        <img
                          src={previewIconUrl}
                          alt={`Icon ${meta.label}`}
                          className="h-10 w-10 rounded-md border object-contain p-1"
                        />
                      ) : (
                        <div
                          className="poi-status-marker preview"
                          style={{ ['--marker-color' as string]: meta.color }}
                        >
                          <span>{meta.emoji}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {iconDataUrl
                          ? 'Đang dùng icon upload tùy chỉnh'
                          : 'Đang dùng icon mặc định từ thư mục public'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`category-icon-upload-${category}`} className="text-xs">
                        Upload icon (PNG/JPG/SVG/WebP, tối đa 512KB)
                      </Label>
                      <Input
                        id={`category-icon-upload-${category}`}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={(event) =>
                          handleCategoryIconFileChange(category, event.target.files?.[0])
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => handleResetCategoryIcon(category)}
                        disabled={!iconDataUrl}
                      >
                        <X className="h-4 w-4" />
                        Trả về icon mặc định
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              Mẹo: icon vuông 64x64 hoặc 128x128 sẽ hiển thị đẹp nhất trên marker.
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetAllIcons}
                className="gap-2"
                disabled={isSavingIconConfig}
              >
                <Upload className="h-4 w-4" />
                Reset tất cả icon
              </Button>
              <Button
                type="button"
                onClick={() => void handleSaveIconConfig()}
                className="gap-2"
                disabled={isSavingIconConfig || !hasUnsavedIconChanges}
              >
                <Save className="h-4 w-4" />
                {isSavingIconConfig ? 'Đang lưu...' : 'Lưu cấu hình icon'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
