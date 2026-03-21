'use client'

import { useState } from 'react'
import { Search, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShopCard } from '@/components/shops/shop-card'
import { ShopCardSkeleton } from '@/components/ui/skeletons'
import { EmptyState } from '@/components/ui/empty-states'
import { ErrorBanner } from '@/components/ui/error-banner'
import { mockShops } from '@/lib/mock-data'
import type { Shop } from '@/lib/types'

interface ShopsPageProps {
  onPlayAudio: (title: string) => void
  onScanQR: () => void
}

export function ShopsPage({ onPlayAudio, onScanQR }: ShopsPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)

  const handleSearch = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleListen = (shop: Shop) => {
    onPlayAudio(`Thuyết minh: ${shop.name}`)
  }

  const filteredShops = mockShops.filter(shop => 
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (error) {
    return (
      <div className="p-4">
        <ErrorBanner onRetry={() => setError(false)} />
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Search Card */}
      <div className="mx-4 mt-4 bg-card border border-border rounded-xl p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Tìm quán ăn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-10"
          />
          <Button onClick={handleSearch} className="h-10 px-4">
            <Search className="h-4 w-4 mr-1.5" />
            Tìm
          </Button>
        </div>
        <Button 
          variant="secondary" 
          className="w-full mt-3 h-10"
          onClick={onScanQR}
        >
          <QrCode className="h-4 w-4 mr-2" />
          Quét QR quán
        </Button>
      </div>

      {/* Shop Results */}
      <section className="mt-4">
        <div className="px-4 mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {filteredShops.length} quán ăn
          </h3>
        </div>
        
        {isLoading ? (
          <div className="px-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <ShopCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="px-4">
            <EmptyState type="shops" onAction={() => setSearchQuery('')} />
          </div>
        ) : (
          <div className="px-4 space-y-3">
            {filteredShops.map((shop) => (
              <ShopCard 
                key={shop.id} 
                shop={shop}
                onListen={() => handleListen(shop)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
