'use client'

import { UtensilsCrossed, Store, ClipboardList, History, MapPinOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  type: 'dishes' | 'shops' | 'orders' | 'history' | 'nearby'
  onAction?: () => void
}

const emptyStates = {
  dishes: {
    icon: UtensilsCrossed,
    title: 'Chưa có món ăn',
    description: 'Hiện tại chưa có món ăn nào. Hãy thử tìm kiếm hoặc quay lại sau.',
    actionLabel: 'Tìm kiếm',
  },
  shops: {
    icon: Store,
    title: 'Chưa có quán ăn',
    description: 'Không tìm thấy quán ăn nào phù hợp. Hãy thử tìm kiếm khác.',
    actionLabel: 'Tìm kiếm',
  },
  orders: {
    icon: ClipboardList,
    title: 'Chưa có đơn hàng',
    description: 'Bạn chưa có đơn hàng nào. Hãy khám phá các món ăn ngon!',
    actionLabel: 'Khám phá ngay',
  },
  history: {
    icon: History,
    title: 'Chưa có lịch sử',
    description: 'Bạn chưa nghe thuyết minh nào. Hãy bắt đầu khám phá!',
    actionLabel: 'Bắt đầu nghe',
  },
  nearby: {
    icon: MapPinOff,
    title: 'Không có quán gần bạn',
    description: 'Không tìm thấy quán ăn nào gần vị trí hiện tại.',
    actionLabel: 'Tìm quán khác',
  },
}

export function EmptyState({ type, onAction }: EmptyStateProps) {
  const state = emptyStates[type]
  const Icon = state.icon

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{state.title}</h3>
      <p className="text-sm text-muted-foreground max-w-[280px] mb-6">
        {state.description}
      </p>
      {onAction && (
        <Button onClick={onAction} variant="default">
          {state.actionLabel}
        </Button>
      )}
    </div>
  )
}
