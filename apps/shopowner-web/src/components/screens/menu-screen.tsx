"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { deleteDish, getDishesByShopId, type Dish, updateDish } from "@/services/dish-service"
import { Search, Plus, MoreVertical, Filter, Star, UtensilsCrossed, Loader2 } from "lucide-react"
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
  shopId: number
  reloadToken: number
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ"
}

function resolveDishImage(dish: Dish): string | null {
  if (!dish.image) return null
  if (dish.image.startsWith("http://") || dish.image.startsWith("https://")) {
    return dish.image
  }
  return null
}

export function MenuScreen({ onNavigate, poiApprovalStatus, shopId, reloadToken }: MenuScreenProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "signature" | "regular">("all")
  const [dishes, setDishes] = useState<Dish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [deletingDishId, setDeletingDishId] = useState<number | null>(null)
  const [updatingDishId, setUpdatingDishId] = useState<number | null>(null)

  const loadDishes = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const response = await getDishesByShopId(shopId, { page: 1, size: 100, status: "ACTIVE" })
      setDishes(response.items)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải danh sách món ăn.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDishes()
  }, [shopId, reloadToken])

  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter =
        filter === "all" ||
        (filter === "signature" && Boolean(dish.isSignature)) ||
        (filter === "regular" && !dish.isSignature)
      return matchesSearch && matchesFilter
    })
  }, [dishes, searchQuery, filter])

  const handleDeleteDish = async (dish: Dish) => {
    const shouldDelete = window.confirm(`Bạn có chắc muốn xóa món "${dish.name}"?`)
    if (!shouldDelete) {
      return
    }

    setDeletingDishId(dish.id)
    try {
      await deleteDish(dish.id)
      setDishes((current) => current.filter((item) => item.id !== dish.id))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Xóa món thất bại.")
    } finally {
      setDeletingDishId(null)
    }
  }

  const handleToggleSignature = async (dish: Dish) => {
    setUpdatingDishId(dish.id)
    try {
      const updated = await updateDish(dish.id, { isSignature: !dish.isSignature })
      setDishes((current) =>
        current.map((item) => (item.id === updated.id ? { ...item, isSignature: updated.isSignature } : item)),
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Cập nhật món thất bại.")
    } finally {
      setUpdatingDishId(null)
    }
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {poiApprovalStatus !== "approved" && (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="p-3 text-sm text-muted-foreground">
            POI chưa duyệt: thay đổi thực đơn sẽ được lưu ở dạng nháp.
          </CardContent>
        </Card>
      )}

      {errorMessage ? (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="p-3 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Thực đơn</h1>
          <p className="text-sm text-muted-foreground">{dishes.length} món ăn</p>
        </div>
        <Button className="gap-2" onClick={() => onNavigate("dish-editor", "new")}>
          <Plus className="w-4 h-4" />
          Thêm món
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm món ăn..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
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
            <DropdownMenuItem onClick={() => setFilter("all")}>Tất cả món</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("signature")}>Món nổi bật</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("regular")}>Món thường</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Đang tải thực đơn...</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredDishes.map((dish) => {
            const dishImage = resolveDishImage(dish)
            const isBusy = deletingDishId === dish.id || updatingDishId === dish.id
            return (
              <Card
                key={dish.id}
                className="bg-card border-border overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onNavigate("dish-editor", String(dish.id))}
              >
                <CardContent className="p-0">
                  <div className="flex gap-3">
                    <div className="relative w-24 h-24 shrink-0 rounded-l-lg overflow-hidden">
                      {dishImage ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${dishImage})` }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-muted flex items-center justify-center">
                          <UtensilsCrossed className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 py-3 pr-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{dish.name}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-primary font-bold">{formatPrice(dish.price)}</span>
                            {dish.isSignature ? (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 gap-1"
                              >
                                <Star className="w-3 h-3 fill-current" />
                                Nổi bật
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={isBusy}>
                              {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation()
                                onNavigate("dish-editor", String(dish.id))
                              }}
                            >
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation()
                                void handleToggleSignature(dish)
                              }}
                            >
                              {dish.isSignature ? "Bỏ nổi bật" : "Đánh dấu nổi bật"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(event) => {
                                event.stopPropagation()
                                void handleDeleteDish(dish)
                              }}
                            >
                              Xóa món
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {dish.description ? (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{dish.description}</p>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground italic">Chưa có mô tả.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!isLoading && filteredDishes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy món ăn nào</p>
        </div>
      ) : null}
    </div>
  )
}
