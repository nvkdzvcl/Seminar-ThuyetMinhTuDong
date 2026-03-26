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
import type { POI, POIStatus } from '@/types'
import { fetchAllPois } from '@/services/poiService'
import { fetchAdminSettings, upsertAdminSettings } from '@/services/adminSettingsService'
import {
  POI_MAP_ICON_CONFIG_SETTING_KEY,
  POI_STATUS_META,
  createDefaultPoiMapIconConfig,
  parsePoiMapIconConfig,
  serializePoiMapIconConfig,
  type PoiMapIconConfig,
} from '@/lib/poi-map-config'

const FALLBACK_CENTER: [number, number] = [10.762622, 106.660172]
const MAX_ICON_FILE_SIZE_BYTES = 512 * 1024
const POI_STATUSES: POIStatus[] = ['draft', 'published', 'flagged', 'hidden']

type MappedPoi = POI & { lat: number; lng: number }

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
  }
}

function buildDefaultDivIcon(status: POIStatus): L.DivIcon {
  const meta = POI_STATUS_META[status]
  return L.divIcon({
    className: 'poi-status-marker-wrapper',
    html: `<div class="poi-status-marker" style="--marker-color:${meta.color};"><span>${meta.emoji}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  })
}

function buildCustomIcon(dataUrl: string): L.Icon {
  return L.icon({
    iconUrl: dataUrl,
    iconSize: [40, 40],
    iconAnchor: [20, 36],
    popupAnchor: [0, -30],
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
  const [iconConfig, setIconConfig] = useState<PoiMapIconConfig>(createDefaultPoiMapIconConfig())
  const [savedIconConfigSerialized, setSavedIconConfigSerialized] = useState(
    serializePoiMapIconConfig(createDefaultPoiMapIconConfig())
  )
  const [isLoadingPois, setIsLoadingPois] = useState(true)
  const [isLoadingIconConfig, setIsLoadingIconConfig] = useState(true)
  const [isSavingIconConfig, setIsSavingIconConfig] = useState(false)

  const loadPois = useCallback(async () => {
    setIsLoadingPois(true)
    try {
      const allPois = await fetchAllPois({ pageSize: 100, maxPages: 50 })
      const mappedPois = allPois.map(toMappedPoi).filter((item): item is MappedPoi => item !== null)
      setPois(mappedPois)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không tải được dữ liệu POI cho bản đồ')
      setPois([])
    } finally {
      setIsLoadingPois(false)
    }
  }, [])

  const loadIconConfig = useCallback(async () => {
    setIsLoadingIconConfig(true)
    try {
      const settings = await fetchAdminSettings()
      const rawSetting =
        settings.find((item) => item.key === POI_MAP_ICON_CONFIG_SETTING_KEY)?.value ?? null
      const parsed = parsePoiMapIconConfig(rawSetting)
      const serialized = serializePoiMapIconConfig(parsed)
      setIconConfig(parsed)
      setSavedIconConfigSerialized(serialized)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không tải được cấu hình icon bản đồ')
      const fallback = createDefaultPoiMapIconConfig()
      setIconConfig(fallback)
      setSavedIconConfigSerialized(serializePoiMapIconConfig(fallback))
    } finally {
      setIsLoadingIconConfig(false)
    }
  }, [])

  useEffect(() => {
    void loadPois()
    void loadIconConfig()
  }, [loadIconConfig, loadPois])

  const markerIcons = useMemo<Record<POIStatus, L.Icon | L.DivIcon>>(
    () => ({
      draft: iconConfig.draft ? buildCustomIcon(iconConfig.draft) : buildDefaultDivIcon('draft'),
      published: iconConfig.published
        ? buildCustomIcon(iconConfig.published)
        : buildDefaultDivIcon('published'),
      flagged: iconConfig.flagged ? buildCustomIcon(iconConfig.flagged) : buildDefaultDivIcon('flagged'),
      hidden: iconConfig.hidden ? buildCustomIcon(iconConfig.hidden) : buildDefaultDivIcon('hidden'),
    }),
    [iconConfig]
  )

  const filteredPois = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return pois.filter((poi) => {
      if (!statusFilters[poi.status]) {
        return false
      }
      if (!normalizedSearch) {
        return true
      }
      return (
        poi.name.toLowerCase().includes(normalizedSearch) ||
        (poi.address || '').toLowerCase().includes(normalizedSearch) ||
        (poi.ownerName || '').toLowerCase().includes(normalizedSearch)
      )
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

  const hasUnsavedIconChanges = useMemo(
    () => serializePoiMapIconConfig(iconConfig) !== savedIconConfigSerialized,
    [iconConfig, savedIconConfigSerialized]
  )

  const handleToggleStatusFilter = (status: POIStatus) => {
    setStatusFilters((current) => ({ ...current, [status]: !current[status] }))
  }

  const handleIconFileChange = (status: POIStatus, file?: File | null) => {
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
      setIconConfig((current) => ({ ...current, [status]: result }))
    }
    reader.readAsDataURL(file)
  }

  const handleResetStatusIcon = (status: POIStatus) => {
    setIconConfig((current) => ({ ...current, [status]: null }))
  }

  const handleSaveIconConfig = async () => {
    const serialized = serializePoiMapIconConfig(iconConfig)
    setIsSavingIconConfig(true)
    try {
      await upsertAdminSettings([
        {
          key: POI_MAP_ICON_CONFIG_SETTING_KEY,
          value: serialized,
        },
      ])
      setSavedIconConfigSerialized(serialized)
      toast.success('Đã lưu cấu hình icon bản đồ POI.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lưu cấu hình icon thất bại')
    } finally {
      setIsSavingIconConfig(false)
    }
  }

  const handleResetAllIcons = () => {
    setIconConfig(createDefaultPoiMapIconConfig())
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
          Hiển thị toàn bộ POI có tọa độ. Bạn có thể upload icon riêng cho từng trạng thái POI.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên quán, địa chỉ, chủ quán..."
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
                  description="Kiểm tra lại bộ lọc trạng thái hoặc dữ liệu lat/lng của POI."
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
                {filteredPois.map((poi) => (
                  <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={markerIcons[poi.status]}>
                    <Popup>
                      <div className="space-y-2 text-sm">
                        <p className="text-base font-semibold">{poi.name}</p>
                        <Badge variant="secondary">{POI_STATUS_META[poi.status].label}</Badge>
                        <p className="text-muted-foreground">{poi.address || 'Chưa có địa chỉ'}</p>
                        <p className="text-muted-foreground">Chủ quán: {poi.ownerName || 'N/A'}</p>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => navigate(`/poi/${poi.id}`)}
                        >
                          Xem chi tiết POI
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tùy chỉnh icon POI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {POI_STATUSES.map((status) => {
              const meta = POI_STATUS_META[status]
              const iconDataUrl = iconConfig[status]
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
                      {iconDataUrl
                        ? 'Đang dùng icon upload tùy chỉnh'
                        : 'Đang dùng icon mặc định của hệ thống'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`icon-upload-${status}`} className="text-xs">
                      Upload icon (PNG/JPG/SVG/WebP, tối đa 512KB)
                    </Label>
                    <Input
                      id={`icon-upload-${status}`}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(event) => handleIconFileChange(status, event.target.files?.[0])}
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

