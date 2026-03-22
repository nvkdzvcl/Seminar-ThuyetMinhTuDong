"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Camera, 
  MapPin, 
  Clock, 
  Utensils,
  Globe,
  ImageIcon,
  Flame,
  Users,
  Save,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Send,
  History
} from "lucide-react"
import type { PoiApprovalStatus } from "@/components/app-shell"

interface ShopProfileScreenProps {
  onBack: () => void
  poiApprovalStatus: PoiApprovalStatus
  rejectionReason: string
  onSubmitPoiRegistration: () => void
  onViewApprovalHistory: () => void
}

const touristTags = [
  { id: "english", label: "Hỗ trợ tiếng Anh", icon: Globe },
  { id: "photo-menu", label: "Menu có hình ảnh", icon: ImageIcon },
  { id: "non-spicy", label: "Có món không cay", icon: Flame },
  { id: "family", label: "Chỗ ngồi gia đình", icon: Users },
]

export function ShopProfileScreen({
  onBack,
  poiApprovalStatus,
  rejectionReason,
  onSubmitPoiRegistration,
  onViewApprovalHistory,
}: ShopProfileScreenProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(["english", "photo-menu"])
  const [isOpen, setIsOpen] = useState(true)

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const getPoiStatusInfo = () => {
    if (poiApprovalStatus === "approved") {
      return {
        label: "Đã duyệt",
        description: "POI đã được duyệt, quán có thể hiển thị public.",
        icon: ShieldCheck,
        badgeClass: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
      }
    }
    if (poiApprovalStatus === "pending") {
      return {
        label: "Chờ duyệt",
        description: "Yêu cầu đăng ký POI đang được admin kiểm tra.",
        icon: ShieldAlert,
        badgeClass: "bg-amber-500/15 text-amber-600 border-amber-500/30",
      }
    }
    if (poiApprovalStatus === "rejected") {
      return {
        label: "Bị từ chối",
        description: "Vui lòng chỉnh sửa thông tin và gửi lại yêu cầu duyệt.",
        icon: ShieldX,
        badgeClass: "bg-destructive/10 text-destructive border-destructive/30",
      }
    }
    return {
      label: "Chưa đăng ký",
      description: "Quán chưa đăng ký POI. Nội dung chỉ ở trạng thái nháp.",
      icon: ShieldAlert,
      badgeClass: "bg-muted text-muted-foreground border-border",
    }
  }

  const poiStatusInfo = getPoiStatusInfo()
  const StatusIcon = poiStatusInfo.icon

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Photo */}
      <div className="relative h-48 bg-muted">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            className="bg-black/30 hover:bg-black/50 text-white"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="bg-black/30 hover:bg-black/50 text-white gap-2"
          >
            <Camera className="w-4 h-4" />
            Đổi ảnh bìa
          </Button>
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-12 left-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center shadow-lg border-4 border-background">
              <Utensils className="w-10 h-10 text-primary-foreground" />
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center shadow-md">
              <Camera className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-16 px-4 pb-24 space-y-6">
        {/* Shop Name & Status */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Label htmlFor="shop-name" className="text-foreground font-medium">
              Tên quán
            </Label>
            <Input
              id="shop-name"
              defaultValue="Quán Ốc Bà Sáu"
              className="mt-1.5 h-12 text-lg font-semibold"
            />
          </div>
        </div>

        {/* Status Toggle */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Trạng thái quán</p>
              <p className="text-sm text-muted-foreground">
                {isOpen ? "Quán đang mở cửa" : "Quán đã đóng cửa"}
              </p>
            </div>
            <Switch 
              checked={isOpen} 
              onCheckedChange={setIsOpen}
              className="data-[state=checked]:bg-emerald-500"
            />
          </CardContent>
        </Card>

        {/* POI Approval Status */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className="w-4 h-4" />
                <p className="font-medium text-foreground">Trạng thái POI</p>
              </div>
              <Badge className={poiStatusInfo.badgeClass}>{poiStatusInfo.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{poiStatusInfo.description}</p>
            {poiApprovalStatus === "rejected" && rejectionReason ? (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Lý do từ chối</p>
                <p className="text-sm">{rejectionReason}</p>
              </div>
            ) : null}
            <div className="flex gap-2">
              {(poiApprovalStatus === "unregistered" || poiApprovalStatus === "rejected") && (
                <Button className="gap-2" onClick={onSubmitPoiRegistration}>
                  <Send className="w-4 h-4" />
                  {poiApprovalStatus === "rejected" ? "Gửi lại duyệt" : "Gửi đăng ký POI"}
                </Button>
              )}
              <Button variant="outline" className="gap-2" onClick={onViewApprovalHistory}>
                <History className="w-4 h-4" />
                Lịch sử duyệt
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <div className="space-y-2">
          <Label className="text-foreground font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            Địa chỉ
          </Label>
          <Input
            defaultValue="45 Vĩnh Khánh, Phường 10, Quận 4"
            className="h-12"
          />
        </div>

        {/* Opening Hours */}
        <div className="space-y-2">
          <Label className="text-foreground font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Giờ mở cửa
          </Label>
          <div className="flex gap-3">
            <Input
              defaultValue="16:00"
              type="time"
              className="h-12 flex-1"
            />
            <span className="flex items-center text-muted-foreground">đến</span>
            <Input
              defaultValue="23:00"
              type="time"
              className="h-12 flex-1"
            />
          </div>
        </div>

        {/* Food Category */}
        <div className="space-y-2">
          <Label className="text-foreground font-medium flex items-center gap-2">
            <Utensils className="w-4 h-4 text-muted-foreground" />
            Loại hình ẩm thực
          </Label>
          <Input
            defaultValue="Ốc & Hải sản"
            className="h-12"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-foreground font-medium">
            Giới thiệu ngắn
          </Label>
          <Textarea
            defaultValue="Quán ốc gia truyền 30 năm tại phố ẩm thực Vĩnh Khánh. Chuyên các món ốc tươi sống, hải sản nướng và lẩu."
            className="min-h-[100px] resize-none"
          />
        </div>

        {/* Tourist-Friendly Tags */}
        <div className="space-y-3">
          <Label className="text-foreground font-medium">
            Thẻ thân thiện với du khách
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {touristTags.map((tag) => {
              const Icon = tag.icon
              const isSelected = selectedTags.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm ${isSelected ? "text-primary font-medium" : "text-foreground"}`}>
                    {tag.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Save Button */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
          <div className="max-w-md mx-auto">
            <Button className="w-full h-12 text-base font-semibold gap-2">
              <Save className="w-5 h-5" />
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
