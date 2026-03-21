'use client'

import { useState } from 'react'
import { Search, MapPin, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DishCard } from '@/components/dishes/dish-card'
import { MapSkeleton, DishCardSkeleton } from '@/components/ui/skeletons'
import { EmptyState } from '@/components/ui/empty-states'
import { ErrorBanner } from '@/components/ui/error-banner'
import { ImageFallback } from '@/components/ui/image-fallback'
import { mockDishes, mockShops } from '@/lib/mock-data'
import type { Dish, AudioState } from '@/lib/types'

interface DishesPageProps {
  onPlayAudio: (title: string) => void
}

export function DishesPage({ onPlayAudio }: DishesPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)

  const featuredDishes = mockDishes.filter(d => d.isFeatured)
  const otherDishes = mockDishes.filter(d => !d.isFeatured)
  const nearbyShops = mockShops.slice(0, 3)

  const handleSearch = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleListen = (dish: Dish) => {
    onPlayAudio(`Thuyết minh: ${dish.name}`)
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorBanner onRetry={() => setError(false)} />
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Hero Card */}
      <div className="mx-4 mt-4 bg-primary/5 border border-primary/20 rounded-xl p-4">
        <h2 className="text-lg font-semibold text-foreground">
          Khám phá ẩm thực Vĩnh Khánh
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Nghe thuyết minh AI về các món ăn độc đáo
        </p>
        <div className="flex gap-2 mt-3">
          <Input
            placeholder="Tìm món ăn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-10 bg-card"
          />
          <Button onClick={handleSearch} className="h-10 px-4">
            <Search className="h-4 w-4 mr-1.5" />
            Tìm
          </Button>
        </div>
      </div>

      {/* Quán gần bạn Section */}
      <section className="mt-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Quán gần bạn
          </h3>
          <Button variant="ghost" size="sm" className="h-8 text-primary">
            Xem tất cả
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        {/* Map Preview */}
        <div className="mx-4 mb-3">
          <div className="relative h-32 bg-muted rounded-xl overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Bản đồ quán gần bạn</p>
              </div>
            </div>
            {/* Simulated map dots */}
            <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-primary rounded-full animate-pulse" />
            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-accent rounded-full border-2 border-card" />
            <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-primary rounded-full animate-pulse" />
          </div>
        </div>

        {/* Nearby Shops List */}
        <div className="px-4 space-y-2">
          {nearbyShops.map((shop) => (
            <div 
              key={shop.id} 
              className="flex items-center gap-3 p-2.5 bg-card rounded-lg border border-border"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                <ImageFallback
                  src={shop.imageUrl}
                  alt={shop.name}
                  fill
                  className="w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{shop.name}</p>
                <p className="text-xs text-muted-foreground">{shop.distance}m</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                shop.isOpen 
                  ? 'bg-success/10 text-success' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {shop.isOpen ? 'Đang mở' : 'Đã đóng'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Món nổi bật Section */}
      <section className="mt-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <h3 className="text-base font-semibold text-foreground">Món nổi bật</h3>
        </div>
        
        {isLoading ? (
          <div className="flex gap-3 px-4 overflow-x-auto hide-scrollbar">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-[200px] shrink-0">
                <DishCardSkeleton />
              </div>
            ))}
          </div>
        ) : featuredDishes.length === 0 ? (
          <div className="px-4">
            <EmptyState type="dishes" />
          </div>
        ) : (
          <div className="flex gap-3 px-4 overflow-x-auto hide-scrollbar pb-1">
            {featuredDishes.map((dish) => (
              <DishCard 
                key={dish.id} 
                dish={dish} 
                variant="carousel"
                onListen={() => handleListen(dish)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Món ăn khác Section */}
      <section className="mt-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <h3 className="text-base font-semibold text-foreground">Món ăn khác</h3>
        </div>
        
        {isLoading ? (
          <div className="px-4 grid gap-3">
            {[1, 2].map((i) => (
              <DishCardSkeleton key={i} />
            ))}
          </div>
        ) : otherDishes.length === 0 ? (
          <div className="px-4">
            <EmptyState type="dishes" />
          </div>
        ) : (
          <div className="px-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherDishes.map((dish) => (
              <DishCard 
                key={dish.id} 
                dish={dish}
                onListen={() => handleListen(dish)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
