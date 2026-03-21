'use client'

import { useState } from 'react'
import { ChevronRight, Clock, CheckCircle, XCircle, Headphones } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger 
} from '@/components/ui/sheet'
import { OrderCardSkeleton } from '@/components/ui/skeletons'
import { EmptyState } from '@/components/ui/empty-states'
import { mockOrders } from '@/lib/mock-data'
import type { Order } from '@/lib/types'
import { cn } from '@/lib/utils'

interface OrdersPageProps {
  onPlayAudio: (title: string) => void
}

type OrderTab = 'all' | 'processing' | 'completed' | 'cancelled'

const tabs: { id: OrderTab; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'processing', label: 'Đang xử lý' },
  { id: 'completed', label: 'Hoàn tất' },
  { id: 'cancelled', label: 'Đã hủy' },
]

export function OrdersPage({ onPlayAudio }: OrdersPageProps) {
  const [activeTab, setActiveTab] = useState<OrderTab>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const filteredOrders = activeTab === 'all' 
    ? mockOrders 
    : mockOrders.filter(order => order.status === activeTab)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const statusConfig = {
    processing: {
      label: 'Đang xử lý',
      icon: Clock,
      className: 'bg-warning/10 text-warning',
    },
    completed: {
      label: 'Hoàn tất',
      icon: CheckCircle,
      className: 'bg-success/10 text-success',
    },
    cancelled: {
      label: 'Đã hủy',
      icon: XCircle,
      className: 'bg-destructive/10 text-destructive',
    },
  }

  const handleListenAgain = (order: Order) => {
    onPlayAudio(`Thuyết minh: ${order.shopName}`)
  }

  return (
    <div className="pb-4">
      {/* Tabs */}
      <div className="sticky top-14 z-30 bg-background border-b border-border">
        <div className="flex overflow-x-auto hide-scrollbar px-4 gap-1 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <section className="mt-4">
        {isLoading ? (
          <div className="px-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState type="orders" />
        ) : (
          <div className="px-4 space-y-3">
            {filteredOrders.map((order) => {
              const status = statusConfig[order.status]
              const StatusIcon = status.icon
              
              return (
                <div 
                  key={order.id}
                  className="bg-card rounded-xl border border-border p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-medium text-foreground text-sm truncate">
                        {order.shopName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(order.datetime)}
                      </p>
                    </div>
                    <span className={cn(
                      'flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium shrink-0',
                      status.className
                    )}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-sm font-semibold text-foreground">
                      {formatPrice(order.total)}
                    </span>
                    
                    <div className="flex gap-2">
                      {order.status === 'completed' && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="h-8"
                          onClick={() => handleListenAgain(order)}
                        >
                          <Headphones className="h-3.5 w-3.5 mr-1" />
                          Nghe lại
                        </Button>
                      )}
                      
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8"
                            onClick={() => setSelectedOrder(order)}
                          >
                            Xem chi tiết
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
                          <SheetHeader>
                            <SheetTitle className="text-left">Chi tiết đơn hàng</SheetTitle>
                          </SheetHeader>
                          
                          {selectedOrder && (
                            <div className="mt-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Quán</span>
                                <span className="text-sm font-medium">{selectedOrder.shopName}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Thời gian</span>
                                <span className="text-sm">{formatDate(selectedOrder.datetime)}</span>
                              </div>
                              
                              <div className="border-t border-border pt-4">
                                <p className="text-sm font-medium mb-3">Các món</p>
                                <div className="space-y-2">
                                  {selectedOrder.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between">
                                      <span className="text-sm text-muted-foreground">
                                        {item.name} x{item.quantity}
                                      </span>
                                      <span className="text-sm">{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="border-t border-border pt-4 flex items-center justify-between">
                                <span className="text-base font-semibold">Tổng cộng</span>
                                <span className="text-base font-semibold text-primary">
                                  {formatPrice(selectedOrder.total)}
                                </span>
                              </div>
                            </div>
                          )}
                        </SheetContent>
                      </Sheet>
                    </div>
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
