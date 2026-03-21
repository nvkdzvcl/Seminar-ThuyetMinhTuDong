'use client'

import { Star, Headphones, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageFallback } from '@/components/ui/image-fallback'
import type { Dish } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DishCardProps {
  dish: Dish
  variant?: 'default' | 'carousel'
  onListen?: () => void
  onView?: () => void
}

export function DishCard({ dish, variant = 'default', onListen, onView }: DishCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className={cn(
      'bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow',
      variant === 'carousel' && 'w-[200px] shrink-0'
    )}>
      <div className="relative aspect-[4/3]">
        <ImageFallback
          src={dish.imageUrl}
          alt={dish.name}
          fill
          className="w-full h-full"
        />
        {dish.isFeatured && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-full">
            Nổi bật
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-foreground text-sm line-clamp-1">{dish.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{dish.shopName}</p>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-semibold text-primary">{formatPrice(dish.price)}</span>
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-warning fill-warning" />
            <span className="text-xs text-muted-foreground">{dish.rating}</span>
          </div>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button 
            size="sm" 
            className="flex-1 h-9"
            onClick={onListen}
          >
            <Headphones className="h-4 w-4 mr-1.5" />
            Nghe ngay
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            className="flex-1 h-9"
            onClick={onView}
          >
            <Eye className="h-4 w-4 mr-1.5" />
            Xem món
          </Button>
        </div>
      </div>
    </div>
  )
}
