'use client'

import { MapPin, Headphones, Eye, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageFallback } from '@/components/ui/image-fallback'
import type { Shop } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ShopCardProps {
  shop: Shop
  onListen?: () => void
  onView?: () => void
}

export function ShopCard({ shop, onListen, onView }: ShopCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex">
        <div className="w-24 h-24 shrink-0">
          <ImageFallback
            src={shop.imageUrl}
            alt={shop.name}
            fill
            className="w-full h-full"
          />
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
            {shop.rating && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-warning fill-warning" />
                {shop.rating}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 px-3 pb-3">
        <Button 
          size="sm" 
          className="flex-1 h-9"
          onClick={onListen}
        >
          <Headphones className="h-4 w-4 mr-1.5" />
          Nghe thuyết minh
        </Button>
        <Button 
          size="sm" 
          variant="secondary" 
          className="flex-1 h-9"
          onClick={onView}
        >
          <Eye className="h-4 w-4 mr-1.5" />
          Xem quán
        </Button>
      </div>
    </div>
  )
}
