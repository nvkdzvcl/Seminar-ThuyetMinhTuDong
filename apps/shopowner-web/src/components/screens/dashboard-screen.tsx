"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  ChevronRight
} from "lucide-react"

type Screen = "dashboard" | "menu" | "qr" | "insights" | "shop-profile" | "dish-editor" | "audio-management"

interface DashboardScreenProps {
  onNavigate: (screen: Screen) => void
}

export function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const isOpen = true

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      {/* Header with shop info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Utensils className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Quán Ốc Bà Sáu</h1>
            <p className="text-sm text-muted-foreground">Vĩnh Khánh, Quận 4</p>
          </div>
        </div>
        <Badge 
          variant={isOpen ? "default" : "secondary"}
          className={isOpen 
            ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30" 
            : "bg-muted text-muted-foreground"
          }
        >
          {isOpen ? "Đang mở" : "Đã đóng"}
        </Badge>
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
                <p className="text-2xl font-bold text-foreground">127</p>
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
                <p className="text-2xl font-bold text-foreground">89</p>
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
                <p className="text-lg font-bold text-foreground">Tiếng Anh</p>
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
                <p className="text-lg font-bold text-foreground">Ốc hương</p>
                <p className="text-xs text-muted-foreground">Món được xem nhiều</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
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
        
        <Card className="bg-card border-border">
          <CardContent className="p-0 divide-y divide-border">
            <ActivityItem 
              icon={<QrCode className="w-4 h-4" />}
              iconBg="bg-primary/10"
              iconColor="text-primary"
              title="Khách quét mã QR"
              subtitle="Nghe giới thiệu bằng tiếng Hàn"
              time="5 phút trước"
            />
            <ActivityItem 
              icon={<Headphones className="w-4 h-4" />}
              iconBg="bg-[oklch(0.7_0.16_55)]/10"
              iconColor="text-[oklch(0.7_0.16_55)]"
              title="Audio được phát"
              subtitle="Món Ốc hương nướng mỡ hành"
              time="12 phút trước"
            />
            <ActivityItem 
              icon={<Globe className="w-4 h-4" />}
              iconBg="bg-[oklch(0.85_0.15_85)]/15"
              iconColor="text-[oklch(0.7_0.12_85)]"
              title="Bản dịch mới"
              subtitle="Đã dịch sang tiếng Nhật"
              time="1 giờ trước"
            />
          </CardContent>
        </Card>
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
              Du khách Hàn Quốc chiếm 40% lượt nghe audio tuần này. Cân nhắc thêm món ăn phù hợp khẩu vị Hàn.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
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
