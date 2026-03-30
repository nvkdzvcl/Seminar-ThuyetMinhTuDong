"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  QrCode, 
  Headphones,
  Globe, 
  Utensils, 
  Store, 
  UtensilsCrossed, 
  Sparkles, 
  Eye,
  TrendingUp,
  ChevronRight,
  ShieldAlert,
  UserCircle2,
  Settings,
  LogOut
} from "lucide-react"
import { getOwnerHomeStats, type OwnerHomeStats } from "@/services/dashboard-service"
import type { PoiApprovalStatus } from "@/components/app-shell"

type Screen = "dashboard" | "menu" | "qr" | "insights" | "shop-profile" | "dish-editor" | "audio-management"

interface DashboardScreenProps {
  onNavigate: (screen: Screen) => void
  poiApprovalStatus: PoiApprovalStatus
  rejectionReason: string
  onLogout: () => void
  shopName?: string
  shopAddress?: string
}

export function DashboardScreen({
  onNavigate,
  poiApprovalStatus,
  rejectionReason,
  onLogout,
  shopName = "Quán của tôi",
  shopAddress = "",
}: DashboardScreenProps) {
  const [homeStats, setHomeStats] = useState<OwnerHomeStats | null>(null)
  const [isLoadingInsights, setIsLoadingInsights] = useState(true)
  const [insightsError, setInsightsError] = useState("")
  const isOpen = true
  const isApproved = poiApprovalStatus === "approved"

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setIsLoadingInsights(true)
      setInsightsError("")
      try {
        const result = await getOwnerHomeStats()
        if (cancelled) {
          return
        }
        setHomeStats(result)
      } catch (error) {
        if (cancelled) {
          return
        }
        setInsightsError(error instanceof Error ? error.message : "Không tải được dữ liệu thống kê.")
      } finally {
        if (!cancelled) {
          setIsLoadingInsights(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const topLanguage = homeStats?.topLanguage ?? "Chưa có"
  const topDish = homeStats?.topDish ?? "Chưa có"
  const qrScansToday = homeStats?.qrScansToday ?? 0
  const audioPlaysToday = homeStats?.audioPlaysToday ?? 0

  const recentActivities = useMemo(() => {
    return (homeStats?.recentActivities ?? []).map((item, index) => mapRecentActivityItem(item, index))
  }, [homeStats?.recentActivities])

  const aiInsightText = useMemo(() => {
    if (qrScansToday <= 0 && audioPlaysToday <= 0) {
      return "Hôm nay chưa có lượt quét QR hoặc nghe audio. Khi khách bắt đầu tương tác, bảng thống kê sẽ cập nhật theo thời gian thực."
    }

    return `Hôm nay có ${qrScansToday} lượt quét QR và ${audioPlaysToday} lượt nghe audio. Ngôn ngữ nổi bật là ${topLanguage}, nội dung được quan tâm nhiều là ${topDish}.`
  }, [audioPlaysToday, qrScansToday, topDish, topLanguage])

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      {/* Header with shop info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Utensils className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{shopName}</h1>
            <p className="text-sm text-muted-foreground">{shopAddress || "Chưa cập nhật địa chỉ"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={isOpen ? "default" : "secondary"}
            className={
              isOpen
                ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30"
                : "bg-muted text-muted-foreground"
            }
          >
            {isOpen ? "Đang mở" : "Đã đóng"}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl">
                <UserCircle2 className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Tài khoản chủ quán</DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  onNavigate("shop-profile")
                }}
              >
                <Settings className="h-4 w-4" />
                Hồ sơ & cài đặt quán
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={(event) => {
                  event.preventDefault()
                  onLogout()
                }}
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{qrScansToday}</p>
                <p className="text-xs text-muted-foreground">Quét QR hôm nay</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[oklch(0.7_0.16_55)]/10 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-[oklch(0.7_0.16_55)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{audioPlaysToday}</p>
                <p className="text-xs text-muted-foreground">Lượt nghe audio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[oklch(0.85_0.15_85)]/15 flex items-center justify-center">
                <Globe className="w-5 h-5 text-[oklch(0.7_0.12_85)]" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{topLanguage}</p>
                <p className="text-xs text-muted-foreground">Ngôn ngữ phổ biến</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{topDish}</p>
                 <p className="text-xs text-muted-foreground">Món được xem nhiều</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoadingInsights ? (
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-xs text-muted-foreground">Đang tải dữ liệu thống kê thật...</CardContent>
        </Card>
      ) : null}
      {!isLoadingInsights && insightsError ? (
        <Card className="bg-card border-destructive/30">
          <CardContent className="p-3 text-xs text-destructive">{insightsError}</CardContent>
        </Card>
      ) : null}

      {/* Quick Actions */}
      {!isApproved && (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  POI chưa được duyệt
                </p>
                <p className="text-sm text-muted-foreground">
                  Menu và audio chỉ ở trạng thái nháp, chưa public cho khách.
                </p>
                {poiApprovalStatus === "rejected" && rejectionReason ? (
                  <p className="text-xs text-muted-foreground">Lý do: {rejectionReason}</p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 border-border hover:bg-secondary hover:border-primary/30"
            onClick={() => onNavigate("shop-profile")}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">Chỉnh sửa quán</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 border-border hover:bg-secondary hover:border-primary/30"
            onClick={() => onNavigate("menu")}
          >
            <div className="w-10 h-10 rounded-full bg-[oklch(0.7_0.16_55)]/10 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-[oklch(0.7_0.16_55)]" />
            </div>
            <span className="text-sm font-medium text-foreground">Quản lý thực đơn</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 border-border hover:bg-secondary hover:border-primary/30"
            onClick={() => onNavigate("audio-management")}
          >
            <div className="w-10 h-10 rounded-full bg-[oklch(0.85_0.15_85)]/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[oklch(0.7_0.12_85)]" />
            </div>
            <span className="text-sm font-medium text-foreground">Tạo mô tả AI</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 border-border hover:bg-secondary hover:border-primary/30"
            onClick={() => onNavigate("qr")}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-foreground">Xem mã QR</span>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Hoạt động gần đây</h2>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 h-auto p-0">
            Xem tất cả
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        {recentActivities.length > 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-0 divide-y divide-border">
              {recentActivities.map((activity) => (
                <ActivityItem
                  key={activity.key}
                  icon={activity.icon}
                  iconBg={activity.iconBg}
                  iconColor={activity.iconColor}
                  title={activity.title}
                  subtitle={activity.subtitle}
                  time={activity.time}
                />
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-sm text-muted-foreground">
              Chưa có hoạt động thực tế gần đây.
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Insight Banner */}
      <Card className="bg-[oklch(0.25_0.03_30)] border-0 overflow-hidden">
        <CardContent className="p-4 relative">
          <div className="absolute top-2 right-2 w-16 h-16 rounded-full bg-[oklch(0.7_0.16_55)]/20 blur-xl" />
          <div className="absolute bottom-0 right-8 w-12 h-12 rounded-full bg-[oklch(0.85_0.15_85)]/20 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[oklch(0.85_0.15_85)]" />
              <span className="text-xs font-medium text-[oklch(0.85_0.15_85)]">AI Insight</span>
            </div>
            <p className="text-sm text-[oklch(0.95_0.01_85)] leading-relaxed">
              {aiInsightText}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatDateTime(raw?: string): string {
  if (!raw) {
    return ""
  }
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return raw
  }

  return parsed.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function mapRecentActivityItem(item: OwnerHomeStats["recentActivities"][number], index: number): ActivityDisplayItem {
  const normalizedType = (item.type || "").toUpperCase()
  if (normalizedType.includes("QR_SCAN")) {
    return {
      key: `activity-${index}-${item.occurredAt}`,
      icon: <QrCode className="w-4 h-4" />,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      title: item.title,
      subtitle: item.subtitle,
      time: formatDateTime(item.occurredAt),
    }
  }

  if (normalizedType.includes("AUDIO")) {
    return {
      key: `activity-${index}-${item.occurredAt}`,
      icon: <Headphones className="w-4 h-4" />,
      iconBg: "bg-[oklch(0.7_0.16_55)]/10",
      iconColor: "text-[oklch(0.7_0.16_55)]",
      title: item.title,
      subtitle: item.subtitle,
      time: formatDateTime(item.occurredAt),
    }
  }

  return {
    key: `activity-${index}-${item.occurredAt}`,
    icon: <ShieldAlert className="w-4 h-4" />,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    title: item.title,
    subtitle: item.subtitle,
    time: formatDateTime(item.occurredAt),
  }
}

interface ActivityDisplayItem {
  key: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  title: string
  subtitle: string
  time: string
}

interface ActivityItemProps {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  title: string
  subtitle: string
  time: string
}

function ActivityItem({ icon, iconBg, iconColor, title, subtitle, time }: ActivityItemProps) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center ${iconColor}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
    </div>
  )
}
