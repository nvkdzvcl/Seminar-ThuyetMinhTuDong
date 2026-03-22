"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Plus, 
  Volume2, 
  MoreVertical,
  Filter,
  Flame
} from "lucide-react"
import type { PoiApprovalStatus } from "@/components/app-shell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Screen = "dashboard" | "menu" | "qr" | "insights" | "shop-profile" | "dish-editor" | "audio-management"

interface MenuScreenProps {
  onNavigate: (screen: Screen, dishId?: string) => void
  poiApprovalStatus: PoiApprovalStatus
}

const dishes = [
  {
    id: "1",
    name: "Ốc hương nướng mỡ hành",
    price: 180000,
    image: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400&q=80",
    available: true,
    hasAudio: true,
    spicyLevel: 1,
  },
  {
    id: "2",
    name: "Nghêu hấp sả",
    price: 85000,
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80",
    available: true,
    hasAudio: true,
    spicyLevel: 0,
  },
  {
    id: "3",
    name: "Sò điệp nướng phô mai",
    price: 120000,
    image: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&q=80",
    available: true,
    hasAudio: false,
    spicyLevel: 0,
  },
  {
    id: "4",
    name: "Ốc len xào dừa",
    price: 95000,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
    available: false,
    hasAudio: true,
    spicyLevel: 2,
  },
  {
    id: "5",
    name: "Cua rang me",
    price: 350000,
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80",
    available: true,
    hasAudio: true,
    spicyLevel: 1,
  },
  {
    id: "6",
    name: "Mực nướng sa tế",
    price: 150000,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
    available: true,
    hasAudio: false,
    spicyLevel: 3,
  },
]

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
}

function SpicyIndicator({ level }: { level: number }) {
  if (level === 0) return null
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: level }).map((_, i) => (
        <Flame key={i} className="w-3 h-3 text-primary fill-primary" />
      ))}
    </div>
  )
}

export function MenuScreen({ onNavigate, poiApprovalStatus }: MenuScreenProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "available" | "unavailable">("all")

  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === "all" || 
      (filter === "available" && dish.available) ||
      (filter === "unavailable" && !dish.available)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {poiApprovalStatus !== "approved" && (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="p-3 text-sm text-muted-foreground">
            POI chưa duyệt: thay đổi thực đơn sẽ được lưu ở dạng nháp.
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Thực đơn</h1>
          <p className="text-sm text-muted-foreground">{dishes.length} món ăn</p>
        </div>
        <Button 
          className="gap-2"
          onClick={() => onNavigate("dish-editor", "new")}
        >
          <Plus className="w-4 h-4" />
          Thêm món
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm món ăn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0">
              <Filter className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilter("all")}>
              Tất cả
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("available")}>
              Còn bán
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("unavailable")}>
              Hết hàng
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dish Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredDishes.map((dish) => (
          <Card 
            key={dish.id} 
            className="bg-card border-border overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigate("dish-editor", dish.id)}
          >
            <CardContent className="p-0">
              <div className="flex gap-3">
                {/* Image */}
                <div className="relative w-24 h-24 shrink-0">
                  <div 
                    className="absolute inset-0 bg-cover bg-center rounded-l-lg"
                    style={{ backgroundImage: `url(${dish.image})` }}
                  />
                  {!dish.available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-l-lg">
                      <span className="text-xs font-medium text-white">Hết hàng</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 py-3 pr-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{dish.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-primary font-bold">{formatPrice(dish.price)}</span>
                        <SpicyIndicator level={dish.spicyLevel} />
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          onNavigate("dish-editor", dish.id)
                        }}>
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          {dish.available ? "Đánh dấu hết hàng" : "Đánh dấu còn hàng"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Xóa món
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Audio Status */}
                  <div className="mt-2">
                    {dish.hasAudio ? (
                      <Badge variant="secondary" className="gap-1 text-xs bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15">
                        <Volume2 className="w-3 h-3" />
                        Có audio
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 text-xs bg-[oklch(0.7_0.16_55)]/10 text-[oklch(0.6_0.14_55)] hover:bg-[oklch(0.7_0.16_55)]/15">
                        <Volume2 className="w-3 h-3" />
                        Chưa có audio
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDishes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy món ăn nào</p>
        </div>
      )}
    </div>
  )
}
