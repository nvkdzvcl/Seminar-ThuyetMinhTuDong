"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, RefreshCw, ShoppingBag, Timer, CheckCircle2, XCircle, CookingPot } from "lucide-react"
import {
  cancelOrderByShop,
  completeOrder,
  confirmOrder,
  getOrdersForShopOwner,
  type OrderWorkflowStatus,
  type OwnerOrder,
} from "@/services/order-service"

type FilterTab = "all" | "wait" | "preparing" | "completed" | "cancelled"

interface OrderManagementScreenProps {
  shopId: number
}

const TABS: Array<{ id: FilterTab; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "wait", label: "Chờ xác nhận" },
  { id: "preparing", label: "Đang chuẩn bị" },
  { id: "completed", label: "Hoàn tất" },
  { id: "cancelled", label: "Đã hủy" },
]

const STATUS_LABEL: Record<OrderWorkflowStatus, string> = {
  WAIT: "Chờ xác nhận",
  PREPARING: "Đang chuẩn bị",
  COMPLETED: "Hoàn tất",
  CUSTOMER_CANCELLED: "Khách đã hủy",
  SHOP_CANCELLED: "Quán đã hủy",
}

const STATUS_BADGE: Record<OrderWorkflowStatus, string> = {
  WAIT: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  PREPARING: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  CUSTOMER_CANCELLED: "bg-rose-500/15 text-rose-700 border-rose-500/30",
  SHOP_CANCELLED: "bg-rose-500/15 text-rose-700 border-rose-500/30",
}

function formatDate(raw?: string): string {
  if (!raw) return ""
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function OrderManagementScreen({ shopId }: OrderManagementScreenProps) {
  const [orders, setOrders] = useState<OwnerOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [filterTab, setFilterTab] = useState<FilterTab>("all")
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)
  const [bannerMessage, setBannerMessage] = useState("")
  const latestWaitCountRef = useRef(0)

  const loadOrders = async (silent: boolean) => {
    if (silent) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setErrorMessage("")

    try {
      const result = await getOrdersForShopOwner()
      const nextOrders = result.filter((order) => order.shopId === shopId)

      const waitCount = nextOrders.filter((order) => order.orderStatus === "WAIT").length
      if (latestWaitCountRef.current > 0 && waitCount > latestWaitCountRef.current) {
        setBannerMessage("Có đơn mới đang chờ bạn xác nhận.")
      }
      latestWaitCountRef.current = waitCount
      setOrders(nextOrders)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải danh sách đơn.")
    } finally {
      if (silent) {
        setIsRefreshing(false)
      } else {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadOrders(false)

    const pollTimer = window.setInterval(() => {
      void loadOrders(true)
    }, 8000)

    return () => {
      window.clearInterval(pollTimer)
    }
  }, [shopId])

  const filteredOrders = useMemo(() => {
    if (filterTab === "all") return orders
    if (filterTab === "wait") return orders.filter((order) => order.orderStatus === "WAIT")
    if (filterTab === "preparing") return orders.filter((order) => order.orderStatus === "PREPARING")
    if (filterTab === "completed") return orders.filter((order) => order.orderStatus === "COMPLETED")
    return orders.filter(
      (order) => order.orderStatus === "CUSTOMER_CANCELLED" || order.orderStatus === "SHOP_CANCELLED",
    )
  }, [filterTab, orders])

  const handleConfirm = async (orderId: number) => {
    try {
      setUpdatingOrderId(orderId)
      await confirmOrder(orderId)
      setBannerMessage(`Đã xác nhận đơn #${orderId}.`)
      await loadOrders(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Xác nhận đơn thất bại.")
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleComplete = async (orderId: number) => {
    try {
      setUpdatingOrderId(orderId)
      await completeOrder(orderId)
      setBannerMessage(`Đã hoàn tất đơn #${orderId}.`)
      await loadOrders(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Hoàn tất đơn thất bại.")
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleCancel = async (orderId: number) => {
    try {
      setUpdatingOrderId(orderId)
      await cancelOrderByShop(orderId)
      setBannerMessage(`Đơn #${orderId} đã được hủy bởi quán.`)
      await loadOrders(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Hủy đơn thất bại.")
    } finally {
      setUpdatingOrderId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-sm text-muted-foreground">Đang tải danh sách đơn...</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Xử lý đơn hàng</h1>
          <p className="text-sm text-muted-foreground">Theo dõi và cập nhật trạng thái đơn của quán</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => {
            void loadOrders(true)
          }}
          disabled={isRefreshing}
        >
          {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>

      {bannerMessage ? (
        <Card className="border-emerald-500/30 bg-emerald-500/10">
          <CardContent className="p-3 text-sm text-emerald-700">{bannerMessage}</CardContent>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="p-3 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={filterTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterTab(tab.id)}
            className="whitespace-nowrap"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">Chưa có đơn hàng nào.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isBusy = updatingOrderId === order.id
            const isExpanded = expandedOrderId === order.id
            const isWaiting = order.orderStatus === "WAIT"
            const isPreparing = order.orderStatus === "PREPARING"

            return (
              <Card key={order.id} className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Đơn #{order.id}</p>
                      <p className="text-sm font-semibold text-foreground">{order.customerName || "Khách hàng"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <Badge className={STATUS_BADGE[order.orderStatus]}>{STATUS_LABEL[order.orderStatus]}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Tổng tiền</p>
                      <p className="font-semibold text-foreground">
                        {Number(order.totalPrice || 0).toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Số món</p>
                      <p className="font-semibold text-foreground">
                        {order.orderItems.reduce((total, item) => total + (item.quantity || 0), 0)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedOrderId((current) => (current === order.id ? null : order.id))}
                    >
                      {isExpanded ? "Ẩn chi tiết" : "Xem chi tiết"}
                    </Button>

                    {isWaiting ? (
                      <Button size="sm" onClick={() => void handleConfirm(order.id)} disabled={isBusy}>
                        {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Timer className="h-4 w-4" />}
                        Xác nhận
                      </Button>
                    ) : isPreparing ? (
                      <Button size="sm" onClick={() => void handleComplete(order.id)} disabled={isBusy}>
                        {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Hoàn tất
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        <ShoppingBag className="h-4 w-4" />
                        Đã xử lý
                      </Button>
                    )}
                  </div>

                  {(isWaiting || isPreparing) ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => void handleCancel(order.id)}
                      disabled={isBusy}
                      className="w-full"
                    >
                      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      Hủy đơn do hết món
                    </Button>
                  ) : null}

                  {isExpanded ? (
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="mb-2 text-sm font-semibold text-foreground">Chi tiết món</p>
                      <div className="space-y-1.5">
                        {order.orderItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <CookingPot className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-foreground">
                                {item.dishName || `Món #${item.dishId}`} x{item.quantity}
                              </span>
                            </div>
                            <span className="font-medium text-foreground">
                              {Number((item.pricePerUnit || 0) * (item.quantity || 0)).toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
