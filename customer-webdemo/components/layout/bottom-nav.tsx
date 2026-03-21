'use client'

import { UtensilsCrossed, Store, MapPinned, QrCode, ClipboardList, User } from 'lucide-react'
import type { TabId } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'dishes', label: 'Món ăn', icon: UtensilsCrossed },
  { id: 'shops', label: 'Quán ăn', icon: Store },
  { id: 'nearby', label: 'Gần tôi', icon: MapPinned },
  { id: 'scan', label: 'Quét QR', icon: QrCode },
  { id: 'orders', label: 'Đơn hàng', icon: ClipboardList },
  { id: 'profile', label: 'Hồ sơ', icon: User },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border safe-area-pb">
      <div className="grid grid-cols-6 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 transition-colors min-h-[44px]',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground active:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
              <span className={cn(
                'text-[10px] leading-tight',
                isActive ? 'font-medium' : 'font-normal'
              )}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
