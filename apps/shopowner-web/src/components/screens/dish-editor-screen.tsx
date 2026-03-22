"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Camera, 
  Sparkles, 
  Globe,
  Volume2,
  Play,
  Flame,
  Save,
  Trash2,
  Check
} from "lucide-react"
import type { PoiApprovalStatus } from "@/components/app-shell"

interface DishEditorScreenProps {
  dishId: string | null
  poiApprovalStatus: PoiApprovalStatus
  onBack: () => void
}

const spicyLevels = [
  { value: 0, label: "Không cay" },
  { value: 1, label: "Ít cay" },
  { value: 2, label: "Cay vừa" },
  { value: 3, label: "Rất cay" },
]

export function DishEditorScreen({ dishId, poiApprovalStatus, onBack }: DishEditorScreenProps) {
  const isNew = dishId === "new"
  const isApproved = poiApprovalStatus === "approved"
  const [spicyLevel, setSpicyLevel] = useState(1)
  const [isRecommended, setIsRecommended] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateAI = async () => {
    setIsGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsGenerating(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">
              {isNew ? "Thêm món mới" : "Chỉnh sửa món"}
            </h1>
          </div>
          {!isNew && (
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 py-6 pb-32 space-y-6">
        {!isApproved && (
          <Card className="border-amber-500/40 bg-amber-500/10">
            <CardContent className="p-3 text-sm text-muted-foreground">
              POI chưa duyệt: món ăn sẽ được lưu ở dạng nháp và chưa hiển thị public.
            </CardContent>
          </Card>
        )}

        {/* Image Upload */}
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Hình ảnh món ăn</Label>
          <div className="relative aspect-[4/3] rounded-2xl bg-muted border-2 border-dashed border-border overflow-hidden">
            {!isNew ? (
              <>
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ 
                    backgroundImage: "url('https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80')"
                  }}
                />
                <div className="absolute inset-0 bg-black/20" />
              </>
            ) : null}
            <button className="absolute inset-0 flex flex-col items-center justify-center gap-2 hover:bg-black/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <Camera className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-white drop-shadow-lg">
                {isNew ? "Tải ảnh lên" : "Đổi ảnh"}
              </span>
            </button>
          </div>
        </div>

        {/* Dish Name */}
        <div className="space-y-2">
          <Label htmlFor="dish-name" className="text-foreground font-medium">
            Tên món ăn
          </Label>
          <Input
            id="dish-name"
            defaultValue={isNew ? "" : "Ốc hương nướng mỡ hành"}
            placeholder="VD: Ốc hương nướng mỡ hành"
            className="h-12"
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price" className="text-foreground font-medium">
            Giá (VNĐ)
          </Label>
          <Input
            id="price"
            type="number"
            defaultValue={isNew ? "" : "180000"}
            placeholder="180000"
            className="h-12"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Mô tả món ăn</Label>
          <Textarea
            defaultValue={isNew ? "" : "Ốc hương tươi được nướng trên than hoa, phết mỡ hành thơm phức. Món ăn đặc trưng của phố ẩm thực Vĩnh Khánh với hương vị đậm đà, thịt ốc ngọt và dai."}
            placeholder="Mô tả ngắn về món ăn, nguồn gốc, cách chế biến..."
            className="min-h-[100px] resize-none"
          />
        </div>

        {/* Main Ingredients */}
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Nguyên liệu chính</Label>
          <Input
            defaultValue={isNew ? "" : "Ốc hương, mỡ hành, tỏi, ớt"}
            placeholder="VD: Ốc hương, mỡ hành, tỏi"
            className="h-12"
          />
        </div>

        {/* Spicy Level */}
        <div className="space-y-3">
          <Label className="text-foreground font-medium">Độ cay</Label>
          <div className="flex gap-2">
            {spicyLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => setSpicyLevel(level.value)}
                className={`flex-1 py-3 px-2 rounded-xl border-2 transition-all ${
                  spicyLevel === level.value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="flex gap-0.5">
                    {level.value === 0 ? (
                      <Flame className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      Array.from({ length: level.value }).map((_, i) => (
                        <Flame 
                          key={i} 
                          className={`w-4 h-4 ${
                            spicyLevel === level.value 
                              ? "text-primary fill-primary" 
                              : "text-muted-foreground"
                          }`} 
                        />
                      ))
                    )}
                  </div>
                  <span className={`text-xs ${
                    spicyLevel === level.value 
                      ? "text-primary font-medium" 
                      : "text-muted-foreground"
                  }`}>
                    {level.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recommended for Tourists */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Đề xuất cho du khách</p>
              <p className="text-sm text-muted-foreground">
                Hiển thị nổi bật với khách nước ngoài
              </p>
            </div>
            <Switch 
              checked={isRecommended} 
              onCheckedChange={setIsRecommended}
              className="data-[state=checked]:bg-primary"
            />
          </CardContent>
        </Card>

        {/* AI Generation Section */}
        <div className="space-y-3">
          <Label className="text-foreground font-medium">Công cụ AI</Label>
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 justify-start gap-3 border-border"
              onClick={handleGenerateAI}
              disabled={isGenerating}
            >
              <div className="w-10 h-10 rounded-full bg-[oklch(0.85_0.15_85)]/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[oklch(0.7_0.12_85)]" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">
                  {isGenerating ? "Đang tạo mô tả..." : "Tạo mô tả với AI"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tự động viết mô tả hấp dẫn cho món ăn
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 justify-start gap-3 border-border"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Dịch đa ngôn ngữ</p>
                <p className="text-xs text-muted-foreground">
                  Dịch sang Anh, Hàn, Nhật, Trung
                </p>
              </div>
              <div className="ml-auto flex gap-1">
                <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600">
                  <Check className="w-3 h-3 mr-1" />
                  EN
                </Badge>
                <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600">
                  <Check className="w-3 h-3 mr-1" />
                  KR
                </Badge>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 justify-start gap-3 border-border"
            >
              <div className="w-10 h-10 rounded-full bg-[oklch(0.7_0.16_55)]/10 flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5 text-[oklch(0.7_0.16_55)]" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Xem trước audio</p>
                <p className="text-xs text-muted-foreground">
                  Nghe thử thuyết minh AI
                </p>
              </div>
              <Button 
                size="icon" 
                variant="secondary" 
                className="ml-auto h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <Play className="w-4 h-4" />
              </Button>
            </Button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-md mx-auto">
          <Button className="w-full h-12 text-base font-semibold gap-2">
            <Save className="w-5 h-5" />
            {isApproved ? (isNew ? "Thêm món ăn" : "Lưu thay đổi") : "Lưu nháp"}
          </Button>
        </div>
      </div>
    </div>
  )
}
