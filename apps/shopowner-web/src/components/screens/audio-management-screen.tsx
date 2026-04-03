"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft, 
  Check, 
  AlertCircle, 
  Clock,
  Play,
  Pause,
  RefreshCw,
  Sparkles,
  Volume2,
  Edit3,
  Save
} from "lucide-react"
import type { PoiApprovalStatus } from "@/components/app-shell"

interface AudioManagementScreenProps {
  onBack: () => void
  poiApprovalStatus: PoiApprovalStatus
}

const languages = [
  { 
    code: "vi", 
    name: "Tiếng Việt", 
    flag: "🇻🇳",
    status: "ready" as const,
    text: "Quán Ốc Bà Sáu là quán ốc gia truyền 30 năm tại phố ẩm thực Vĩnh Khánh, Quận 4, TP.HCM. Chuyên phục vụ các món ốc tươi sống, hải sản nướng và lẩu hải sản. Món đặc biệt của quán là ốc hương nướng mỡ hành và sò điệp nướng phô mai."
  },
  { 
    code: "en", 
    name: "English", 
    flag: "🇺🇸",
    status: "ready" as const,
    text: "Ba Sau Snail Restaurant is a 30-year family-owned establishment on Vinh Khanh Food Street, District 4, Ho Chi Minh City. We specialize in fresh snails, grilled seafood, and seafood hotpot. Our signature dishes include grilled snails with scallion oil and cheese-baked scallops."
  },
  { 
    code: "ko", 
    name: "한국어", 
    flag: "🇰🇷",
    status: "ready" as const,
    text: "바 사우 달팽이 레스토랑은 호치민시 4군 빈카인 음식 거리에서 30년 전통의 가족 경영 레스토랑입니다. 신선한 달팽이, 구운 해산물, 해산물 전골을 전문으로 합니다."
  },
  { 
    code: "ja", 
    name: "日本語", 
    flag: "🇯🇵",
    status: "ready" as const,
    text: "バーサウ・スネイル・レストランは、ホーチミン市4区のヴィンカン・フードストリートにある創業30年の家族経営のレストランです。新鮮なカタツムリ、グリルシーフード、シーフード鍋を専門としています。"
  },
  { 
    code: "zh", 
    name: "中文", 
    flag: "🇨🇳",
    status: "needs-review" as const,
    text: "巴绍蜗牛餐厅是一家位于胡志明市第四区永康美食街的30年家族餐厅。我们专门提供新鲜蜗牛、烤海鲜和海鲜火锅。"
  },
]

function getStatusBadge(status: "ready" | "missing" | "needs-review") {
  switch (status) {
    case "ready":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30 gap-1">
          <Check className="w-3 h-3" />
          Sẵn sàng
        </Badge>
      )
    case "missing":
      return (
        <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/20 border-destructive/30 gap-1">
          <AlertCircle className="w-3 h-3" />
          Thiếu
        </Badge>
      )
    case "needs-review":
      return (
        <Badge className="bg-[oklch(0.7_0.16_55)]/15 text-[oklch(0.6_0.14_55)] hover:bg-[oklch(0.7_0.16_55)]/20 border-[oklch(0.7_0.16_55)]/30 gap-1">
          <Clock className="w-3 h-3" />
          Cần xem lại
        </Badge>
      )
  }
}

export function AudioManagementScreen({ onBack, poiApprovalStatus }: AudioManagementScreenProps) {
  const [activeTab, setActiveTab] = useState("vi")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const isApproved = poiApprovalStatus === "approved"

  const activeLanguage = languages.find(l => l.code === activeTab)

  const handleGenerate = async () => {
    setIsGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsGenerating(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 p-4 md:px-6 lg:px-8">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Thuyết minh đa ngôn ngữ</h1>
            <p className="text-xs text-muted-foreground">Quản lý nội dung audio cho du khách</p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6 lg:px-8">
        {!isApproved && (
          <Card className="border-amber-500/40 bg-amber-500/10">
            <CardContent className="p-3 text-sm text-muted-foreground">
              POI chưa duyệt: nội dung audio đang ở trạng thái nháp, chưa public cho du khách.
            </CardContent>
          </Card>
        )}

        {/* Language Status Overview */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-6">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setActiveTab(lang.code)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                activeTab === lang.code
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card border border-border hover:bg-secondary"
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-xs font-medium">{lang.code.toUpperCase()}</span>
              <div className={`w-2 h-2 rounded-full ${
                lang.status === "ready" 
                  ? "bg-emerald-500" 
                  : lang.status === "needs-review"
                  ? "bg-[oklch(0.7_0.16_55)]"
                  : "bg-destructive"
              }`} />
            </button>
          ))}
        </div>

        {/* Active Language Content */}
        {activeLanguage && (
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-4">
              {/* Language Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{activeLanguage.flag}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{activeLanguage.name}</h3>
                    <p className="text-xs text-muted-foreground">Mô tả quán</p>
                  </div>
                </div>
                {getStatusBadge(activeLanguage.status)}
              </div>

              {/* Text Content */}
              <div className="space-y-2">
                {isEditing ? (
                  <Textarea
                    defaultValue={activeLanguage.text}
                    className="min-h-[120px] resize-none"
                  />
                ) : (
                  <div className="p-3 rounded-lg bg-secondary/50 text-sm text-foreground leading-relaxed">
                    {activeLanguage.text}
                  </div>
                )}
              </div>

              {/* Audio Preview */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>
                <div className="flex-1">
                  <div className="h-1 rounded-full bg-border overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: isPlaying ? "60%" : "0%" }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {isPlaying ? "0:18" : "0:00"}
                    </span>
                    <span className="text-xs text-muted-foreground">0:32</span>
                  </div>
                </div>
                <Volume2 className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4" />
                      Lưu văn bản
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      Sửa văn bản
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <Sparkles className="w-4 h-4" />
                  {isGenerating ? "Đang tạo..." : "Tạo với AI"}
                </Button>
              </div>

              {/* Additional Actions */}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Tạo lại audio
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Dịch lại
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips Card */}
        <Card className="bg-[oklch(0.85_0.15_85)]/10 border-[oklch(0.85_0.15_85)]/30">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Sparkles className="w-5 h-5 text-[oklch(0.7_0.12_85)] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-1">Mẹo hay</h4>
                <p className="text-sm text-muted-foreground">
                  Mô tả nên ngắn gọn, súc tích (30-60 giây audio). Nên bao gồm thông tin về lịch sử quán, món đặc biệt và điểm nổi bật.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Stats */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Thống kê theo ngôn ngữ</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {languages.map((lang) => (
              <div key={lang.code} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                <span className="text-lg">{lang.flag}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{lang.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {lang.code === "en" ? "42%" : lang.code === "ko" ? "28%" : lang.code === "ja" ? "15%" : lang.code === "zh" ? "10%" : "5%"}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-primary"
                      style={{ 
                        width: lang.code === "en" ? "42%" : lang.code === "ko" ? "28%" : lang.code === "ja" ? "15%" : lang.code === "zh" ? "10%" : "5%" 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
