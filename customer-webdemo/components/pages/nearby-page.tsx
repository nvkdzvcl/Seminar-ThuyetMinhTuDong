'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Volume2, VolumeX, Navigation, Wifi, WifiOff, Loader2, ChevronRight, Headphones, ArrowUp, ArrowUpRight, ArrowRight, ArrowDownRight, ArrowDown, ArrowDownLeft, ArrowLeft, ArrowUpLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ImageFallback } from '@/components/ui/image-fallback'
import { ShopCardSkeleton, MapSkeleton } from '@/components/ui/skeletons'
import { EmptyState } from '@/components/ui/empty-states'
import { ErrorBanner } from '@/components/ui/error-banner'
import { mockShops } from '@/lib/mock-data'
import type { ConnectionStatus, Shop } from '@/lib/types'
import { cn } from '@/lib/utils'

interface NearbyPageProps {
  onPlayAudio: (title: string) => void
}

// Direction arrow based on bearing
function getDirectionIcon(bearing: number) {
  // Normalize to 0-360
  const normalized = ((bearing % 360) + 360) % 360
  if (normalized >= 337.5 || normalized < 22.5) return ArrowUp
  if (normalized >= 22.5 && normalized < 67.5) return ArrowUpRight
  if (normalized >= 67.5 && normalized < 112.5) return ArrowRight
  if (normalized >= 112.5 && normalized < 157.5) return ArrowDownRight
  if (normalized >= 157.5 && normalized < 202.5) return ArrowDown
  if (normalized >= 202.5 && normalized < 247.5) return ArrowDownLeft
  if (normalized >= 247.5 && normalized < 292.5) return ArrowLeft
  return ArrowUpLeft
}

function getDirectionLabel(bearing: number): string {
  const normalized = ((bearing % 360) + 360) % 360
  if (normalized >= 337.5 || normalized < 22.5) return 'Phía trước'
  if (normalized >= 22.5 && normalized < 67.5) return 'Phía trước bên phải'
  if (normalized >= 67.5 && normalized < 112.5) return 'Bên phải'
  if (normalized >= 112.5 && normalized < 157.5) return 'Phía sau bên phải'
  if (normalized >= 157.5 && normalized < 202.5) return 'Phía sau'
  if (normalized >= 202.5 && normalized < 247.5) return 'Phía sau bên trái'
  if (normalized >= 247.5 && normalized < 292.5) return 'Bên trái'
  return 'Phía trước bên trái'
}

// Simulated shop data with distance and bearing for demo
interface NearbyShop extends Shop {
  bearing: number // Direction from user in degrees
}

export function NearbyPage({ onPlayAudio }: NearbyPageProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus['status']>('connecting')
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  
  // POI overlap state
  const [currentPlayingShopId, setCurrentPlayingShopId] = useState<string | null>(null)
  const lastStableShopIdRef = useRef<string | null>(null)
  
  // Simulated nearby shops with distance and bearing
  const [nearbyShops] = useState<NearbyShop[]>(() => 
    mockShops.map((shop, index) => ({
      ...shop,
      // Simulate some shops being within 10m for demo
      distance: index === 0 ? 5 : index === 1 ? 8 : index === 2 ? 12 : shop.distance,
      bearing: [0, 45, 120, 270][index] ?? 90,
    }))
  )
  
  // Shops within 10m radius
  const shopsWithin10m = nearbyShops.filter(shop => shop.distance <= 10)
  const hasOverlap = shopsWithin10m.length > 1
  
  // Find nearest shop
  const nearestShop = nearbyShops.reduce((nearest, shop) => 
    shop.distance < nearest.distance ? shop : nearest
  , nearbyShops[0])
  
  // Other nearby shops (not playing, not nearest)
  const otherNearbyShops = nearbyShops.filter(
    shop => shop.id !== currentPlayingShopId && shop.id !== nearestShop.id
  ).slice(0, 3)

  // Stable POI selection - keep current POI unless user manually switches
  useEffect(() => {
    if (isLoading || !autoPlayEnabled) return
    
    // If we have a stable selection and it's still within range, keep it
    if (lastStableShopIdRef.current) {
      const lastShop = shopsWithin10m.find(s => s.id === lastStableShopIdRef.current)
      if (lastShop) {
        if (currentPlayingShopId !== lastStableShopIdRef.current) {
          setCurrentPlayingShopId(lastStableShopIdRef.current)
        }
        return
      }
    }
    
    // Otherwise, select nearest shop within 10m (or overall nearest)
    if (shopsWithin10m.length > 0) {
      const newShopId = shopsWithin10m.reduce((nearest, shop) => 
        shop.distance < nearest.distance ? shop : nearest
      , shopsWithin10m[0]).id
      
      lastStableShopIdRef.current = newShopId
      setCurrentPlayingShopId(newShopId)
      
      // Auto-play if enabled
      const shop = nearbyShops.find(s => s.id === newShopId)
      if (shop) {
        onPlayAudio(`Thuyết minh: ${shop.name}`)
      }
    }
  }, [isLoading, autoPlayEnabled, shopsWithin10m, nearbyShops, currentPlayingShopId, onPlayAudio])

  useEffect(() => {
    // Simulate connection
    const timer = setTimeout(() => {
      setConnectionStatus('connected')
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleManualShopSelect = useCallback((shop: NearbyShop) => {
    lastStableShopIdRef.current = shop.id
    setCurrentPlayingShopId(shop.id)
    onPlayAudio(`Thuyết minh: ${shop.name}`)
    setSheetOpen(false)
  }, [onPlayAudio])

  const handlePlayToggle = useCallback(() => {
    if (currentPlayingShopId) {
      setCurrentPlayingShopId(null)
      lastStableShopIdRef.current = null
    } else {
      const shop = nearestShop
      lastStableShopIdRef.current = shop.id
      setCurrentPlayingShopId(shop.id)
      onPlayAudio(`Thuyết minh: ${shop.name}`)
    }
  }, [currentPlayingShopId, nearestShop, onPlayAudio])

  const handleListen = useCallback((shop: NearbyShop) => {
    lastStableShopIdRef.current = shop.id
    setCurrentPlayingShopId(shop.id)
    onPlayAudio(`Thuyết minh: ${shop.name}`)
  }, [onPlayAudio])

  // Get chip state for a shop
  const getShopChipState = useCallback((shop: NearbyShop): { label: string; className: string } | null => {
    if (currentPlayingShopId === shop.id) {
      return { label: 'Đang phát', className: 'bg-primary text-primary-foreground' }
    }
    if (shop.id === nearestShop.id && currentPlayingShopId !== shop.id) {
      return { label: 'Gần nhất', className: 'bg-accent text-accent-foreground' }
    }
    if (shop.distance <= 10) {
      return { label: 'Trong phạm vi 10m', className: 'bg-warning/10 text-warning' }
    }
    return null
  }, [currentPlayingShopId, nearestShop.id])

  const connectionStatusConfig = {
    connected: { 
      label: 'Đã kết nối', 
      icon: Wifi, 
      className: 'bg-success/10 text-success' 
    },
    connecting: { 
      label: 'Đang kết nối...', 
      icon: Loader2, 
      className: 'bg-warning/10 text-warning' 
    },
    disconnected: { 
      label: 'Mất kết nối', 
      icon: WifiOff, 
      className: 'bg-destructive/10 text-destructive' 
    },
  }

  const status = connectionStatusConfig[connectionStatus]
  const StatusIcon = status.icon
  
  const currentPlayingShop = nearbyShops.find(s => s.id === currentPlayingShopId)

  if (error) {
    return (
      <div className="p-4">
        <ErrorBanner 
          message="Không thể kết nối đến vị trí. Vui lòng kiểm tra GPS."
          onRetry={() => setError(false)} 
        />
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* POI Overlap Banner */}
      {hasOverlap && currentPlayingShop && !isLoading && (
        <div className="mx-4 mt-4 bg-primary/5 border border-primary/20 rounded-xl p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Volume2 className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Bạn đang ở gần nhiều quán</p>
                <p className="text-sm font-medium text-foreground truncate">
                  Đang phát: {currentPlayingShop.name}
                </p>
              </div>
            </div>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="shrink-0 text-primary">
                  Chọn quán khác
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>Chọn quán để nghe</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pb-safe">
                  {shopsWithin10m.map((shop) => {
                    const DirectionIcon = getDirectionIcon(shop.bearing)
                    const isPlaying = currentPlayingShopId === shop.id
                    
                    return (
                      <div 
                        key={shop.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                          isPlaying 
                            ? 'bg-primary/5 border-primary/30' 
                            : 'bg-card border-border'
                        )}
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                          <ImageFallback
                            src={shop.imageUrl}
                            alt={shop.name}
                            fill
                            className="w-full h-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground text-sm truncate">{shop.name}</h4>
                            {isPlaying && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground shrink-0">
                                Đang phát
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {shop.distance}m
                            </span>
                            <span className="flex items-center gap-1">
                              <DirectionIcon className="h-3 w-3" />
                              {getDirectionLabel(shop.bearing)}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isPlaying ? 'secondary' : 'default'}
                          onClick={() => handleManualShopSelect(shop)}
                          disabled={isPlaying}
                          className="shrink-0"
                        >
                          <Headphones className="h-4 w-4 mr-1.5" />
                          {isPlaying ? 'Đang nghe' : 'Nghe quán này'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}

      {/* Connection Status Header */}
      <div className="mx-4 mt-4 flex items-center justify-between">
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
          status.className
        )}>
          <StatusIcon className={cn(
            'h-3.5 w-3.5',
            connectionStatus === 'connecting' && 'animate-spin'
          )} />
          {status.label}
        </div>
      </div>

      {/* Auto-play Toggle */}
      <div className="mx-4 mt-4 bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Volume2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Tự phát audio khi tới gần quán</p>
              <p className="text-xs text-muted-foreground">Tự động nghe thuyết minh</p>
            </div>
          </div>
          <Switch 
            checked={autoPlayEnabled} 
            onCheckedChange={setAutoPlayEnabled}
          />
        </div>
      </div>

      {/* Map Card with POI markers */}
      <div className="mx-4 mt-4">
        {isLoading ? (
          <MapSkeleton className="h-48" />
        ) : (
          <div className="relative h-48 bg-muted rounded-xl overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Navigation className="h-8 w-8 text-accent mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Bạn cách quán {nearestShop.distance}m</p>
              </div>
            </div>
            
            {/* Current location marker */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-accent rounded-full border-2 border-card shadow-lg z-10">
              <div className="absolute inset-0 bg-accent/50 rounded-full animate-ping" />
            </div>
            
            {/* 10m radius indicator */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-dashed border-primary/30 rounded-full" />
            
            {/* Shop markers with chip states */}
            {shopsWithin10m.slice(0, 3).map((shop, index) => {
              const chipState = getShopChipState(shop)
              const positions = [
                { top: '30%', left: '35%' },
                { top: '25%', left: '60%' },
                { top: '55%', left: '25%' },
              ]
              const pos = positions[index]
              
              return (
                <div 
                  key={shop.id}
                  className="absolute flex flex-col items-center gap-1"
                  style={{ top: pos?.top, left: pos?.left }}
                >
                  {chipState && (
                    <span className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap font-medium',
                      chipState.className
                    )}>
                      {chipState.label}
                    </span>
                  )}
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-all',
                    currentPlayingShopId === shop.id 
                      ? 'bg-primary scale-110' 
                      : 'bg-secondary'
                  )}>
                    <MapPin className={cn(
                      'h-4 w-4',
                      currentPlayingShopId === shop.id 
                        ? 'text-primary-foreground' 
                        : 'text-secondary-foreground'
                    )} />
                  </div>
                </div>
              )
            })}
            
            {/* Route line to current playing shop */}
            <div className="absolute top-1/3 left-1/3 w-16 h-0.5 bg-primary/50 origin-left rotate-45" />
          </div>
        )}
      </div>

      {/* Nearest/Playing Shop Card */}
      <section className="mt-4">
        <div className="px-4 mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {currentPlayingShop ? 'Đang phát' : 'Quán gần nhất'}
          </h3>
        </div>
        
        {isLoading ? (
          <div className="px-4">
            <ShopCardSkeleton />
          </div>
        ) : (
          <div className="mx-4 bg-card border border-primary/30 rounded-xl overflow-hidden shadow-sm">
            <div className="relative aspect-[16/9]">
              <ImageFallback
                src={(currentPlayingShop || nearestShop).imageUrl}
                alt={(currentPlayingShop || nearestShop).name}
                fill
                className="w-full h-full"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                {(() => {
                  const shop = currentPlayingShop || nearestShop
                  const chipState = getShopChipState(shop as NearbyShop)
                  if (chipState) {
                    return (
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full font-medium',
                        chipState.className
                      )}>
                        {chipState.label}
                      </span>
                    )
                  }
                  return null
                })()}
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <h3 className="font-semibold text-white text-lg">
                  {(currentPlayingShop || nearestShop).name}
                </h3>
                <p className="text-white/80 text-sm">
                  {(currentPlayingShop || nearestShop).address}
                </p>
              </div>
            </div>
            
            <div className="p-4">
              {/* Quick Facts */}
              {(currentPlayingShop || nearestShop).quickFacts && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {(currentPlayingShop || nearestShop).quickFacts?.map((fact, i) => (
                    <span 
                      key={i}
                      className="text-xs px-2 py-1 bg-secondary rounded-full text-secondary-foreground"
                    >
                      {fact}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1 h-11"
                  onClick={handlePlayToggle}
                >
                  {currentPlayingShopId ? (
                    <>
                      <VolumeX className="h-4 w-4 mr-2" />
                      Tắt audio
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 mr-2" />
                      Phát audio
                    </>
                  )}
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex-1 h-11"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Tới quán
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Other Nearby Shops */}
      <section className="mt-6">
        <div className="px-4 mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Các quán khác gần bạn</h3>
        </div>
        
        {isLoading ? (
          <div className="px-4 space-y-3">
            {[1, 2].map((i) => (
              <ShopCardSkeleton key={i} />
            ))}
          </div>
        ) : otherNearbyShops.length === 0 ? (
          <div className="px-4">
            <EmptyState type="nearby" />
          </div>
        ) : (
          <div className="px-4 space-y-3">
            {otherNearbyShops.map((shop) => {
              const chipState = getShopChipState(shop)
              
              return (
                <div 
                  key={shop.id}
                  className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex">
                    <div className="w-24 h-24 shrink-0 relative">
                      <ImageFallback
                        src={shop.imageUrl}
                        alt={shop.name}
                        fill
                        className="w-full h-full"
                      />
                      {chipState && (
                        <div className="absolute top-1 left-1">
                          <span className={cn(
                            'text-[9px] px-1.5 py-0.5 rounded-full font-medium',
                            chipState.className
                          )}>
                            {chipState.label}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium text-foreground text-sm line-clamp-1">{shop.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{shop.category}</p>
                        </div>
                        <span className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium',
                          shop.isOpen 
                            ? 'bg-success/10 text-success' 
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {shop.isOpen ? 'Đang mở' : 'Đã đóng'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {shop.distance}m
                        </span>
                        {(() => {
                          const DirectionIcon = getDirectionIcon(shop.bearing)
                          return (
                            <span className="flex items-center gap-1">
                              <DirectionIcon className="h-3 w-3" />
                              {getDirectionLabel(shop.bearing)}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 px-3 pb-3">
                    <Button 
                      size="sm" 
                      className="flex-1 h-9"
                      onClick={() => handleListen(shop)}
                    >
                      <Headphones className="h-4 w-4 mr-1.5" />
                      Nghe thuyết minh
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="flex-1 h-9"
                    >
                      <Navigation className="h-4 w-4 mr-1.5" />
                      Tới quán
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
