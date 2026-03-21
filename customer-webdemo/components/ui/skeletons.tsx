'use client'

import { cn } from '@/lib/utils'

export function DishCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="aspect-[4/3] bg-muted animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-4 bg-muted animate-pulse rounded w-20" />
          <div className="h-3 bg-muted animate-pulse rounded w-12" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-9 bg-muted animate-pulse rounded flex-1" />
          <div className="h-9 bg-muted animate-pulse rounded flex-1" />
        </div>
      </div>
    </div>
  )
}

export function ShopCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden flex">
      <div className="w-24 h-24 bg-muted animate-pulse shrink-0" />
      <div className="flex-1 p-3 space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
        <div className="flex gap-3 pt-1">
          <div className="h-3 bg-muted animate-pulse rounded w-12" />
          <div className="h-3 bg-muted animate-pulse rounded w-16" />
        </div>
      </div>
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-4 bg-muted animate-pulse rounded w-32" />
          <div className="h-3 bg-muted animate-pulse rounded w-24" />
        </div>
        <div className="h-6 bg-muted animate-pulse rounded w-20" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="h-4 bg-muted animate-pulse rounded w-24" />
        <div className="h-9 bg-muted animate-pulse rounded w-24" />
      </div>
    </div>
  )
}

export function MapSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-muted rounded-xl animate-pulse flex items-center justify-center', className)}>
      <div className="text-muted-foreground/50 text-sm">Đang tải bản đồ...</div>
    </div>
  )
}

export function ListSkeleton({ count = 3, type = 'dish' }: { count?: number; type?: 'dish' | 'shop' | 'order' }) {
  const Skeleton = type === 'dish' ? DishCardSkeleton : type === 'shop' ? ShopCardSkeleton : OrderCardSkeleton
  
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  )
}
