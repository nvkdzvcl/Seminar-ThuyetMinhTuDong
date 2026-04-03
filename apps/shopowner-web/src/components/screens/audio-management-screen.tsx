"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Loader2, Music2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { PoiApprovalStatus } from "@/components/app-shell"
import { getDishesByShopId, type Dish } from "@/services/dish-service"
import {
  generateDishNarration,
  generateShopNarration,
  listDishNarrations,
  listShopNarrations,
  resolveNarrationAudioUrl,
  type DishNarrationItem,
  type ShopNarrationItem,
} from "@/services/narration-service"

interface AudioManagementScreenProps {
  onBack: () => void
  poiApprovalStatus: PoiApprovalStatus
  shopId: number
  initialShopDescription: string
}

type NarrationTab = "shop" | "dish"

const NARRATION_LANGUAGES = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
  { value: "ko", label: "한국어" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
  { value: "th", label: "ไทย" },
  { value: "fr", label: "Français" },
]

function formatDateTime(raw?: string): string {
  if (!raw) return "Chưa có thời gian"
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

function resolveLanguageLabel(language?: string, languageKey?: string): string {
  const key = (languageKey || language || "").toLowerCase()
  const base = key.split("-")[0]
  const found = NARRATION_LANGUAGES.find((item) => item.value === key || item.value === base)
  if (found) {
    return found.label
  }
  return language || languageKey || "Ngôn ngữ khác"
}

export function AudioManagementScreen({
  onBack,
  poiApprovalStatus,
  shopId,
  initialShopDescription,
}: AudioManagementScreenProps) {
  const isApproved = poiApprovalStatus === "approved"
  const [activeTab, setActiveTab] = useState<NarrationTab>("shop")
  const [selectedLanguage, setSelectedLanguage] = useState("vi")
  const [shopDescription, setShopDescription] = useState(initialShopDescription || "")
  const [shopNarrations, setShopNarrations] = useState<ShopNarrationItem[]>([])
  const [isLoadingShopNarrations, setIsLoadingShopNarrations] = useState(false)
  const [isGeneratingShopNarration, setIsGeneratingShopNarration] = useState(false)

  const [dishes, setDishes] = useState<Dish[]>([])
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null)
  const [dishDescription, setDishDescription] = useState("")
  const [dishNarrations, setDishNarrations] = useState<DishNarrationItem[]>([])
  const [isLoadingDishes, setIsLoadingDishes] = useState(false)
  const [isLoadingDishNarrations, setIsLoadingDishNarrations] = useState(false)
  const [isGeneratingDishNarration, setIsGeneratingDishNarration] = useState(false)

  const [notice, setNotice] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedDish = useMemo(
    () => dishes.find((dish) => dish.id === selectedDishId) || null,
    [dishes, selectedDishId],
  )

  const loadShopNarrations = async () => {
    if (!shopId) return
    setIsLoadingShopNarrations(true)
    try {
      const result = await listShopNarrations(shopId)
      setShopNarrations(result)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải audio của quán.")
    } finally {
      setIsLoadingShopNarrations(false)
    }
  }

  const loadDishes = async () => {
    if (!shopId) return
    setIsLoadingDishes(true)
    try {
      const response = await getDishesByShopId(shopId, { status: "ACTIVE", page: 1, size: 200 })
      setDishes(response.items)
      if (response.items.length > 0) {
        setSelectedDishId((current) => current ?? response.items[0].id)
      } else {
        setSelectedDishId(null)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải danh sách món.")
    } finally {
      setIsLoadingDishes(false)
    }
  }

  const loadDishNarrations = async (dishId: number) => {
    setIsLoadingDishNarrations(true)
    try {
      const result = await listDishNarrations(dishId)
      setDishNarrations(result)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải audio của món.")
    } finally {
      setIsLoadingDishNarrations(false)
    }
  }

  useEffect(() => {
    setShopDescription(initialShopDescription || "")
  }, [initialShopDescription])

  useEffect(() => {
    void loadShopNarrations()
    void loadDishes()
  }, [shopId])

  useEffect(() => {
    if (!selectedDish) {
      setDishDescription("")
      setDishNarrations([])
      return
    }
    setDishDescription(selectedDish.description || "")
    void loadDishNarrations(selectedDish.id)
  }, [selectedDish?.id])

  const handleGenerateShopNarration = async () => {
    if (!shopId) return
    if (!shopDescription.trim()) {
      setErrorMessage("Vui lòng nhập description của quán trước khi tạo audio.")
      return
    }

    setErrorMessage(null)
    setNotice(null)
    setIsGeneratingShopNarration(true)
    try {
      await generateShopNarration(shopId, {
        lang: selectedLanguage,
        description: shopDescription.trim(),
      })
      await loadShopNarrations()
      setNotice("Đã tạo/cập nhật audio của quán theo ngôn ngữ đã chọn.")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Tạo audio quán thất bại.")
    } finally {
      setIsGeneratingShopNarration(false)
    }
  }

  const handleGenerateDishNarration = async () => {
    if (!selectedDishId) {
      setErrorMessage("Vui lòng chọn món trước khi tạo audio.")
      return
    }
    if (!dishDescription.trim()) {
      setErrorMessage("Vui lòng nhập description của món trước khi tạo audio.")
      return
    }

    setErrorMessage(null)
    setNotice(null)
    setIsGeneratingDishNarration(true)
    try {
      await generateDishNarration(selectedDishId, {
        lang: selectedLanguage,
        description: dishDescription.trim(),
      })
      await loadDishNarrations(selectedDishId)
      setNotice("Đã tạo/cập nhật audio của món theo ngôn ngữ đã chọn.")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Tạo audio món thất bại.")
    } finally {
      setIsGeneratingDishNarration(false)
    }
  }

  const renderNarrationList = (items: Array<ShopNarrationItem | DishNarrationItem>, loading: boolean) => {
    if (loading) {
      return <p className="text-sm text-muted-foreground">Đang tải danh sách audio...</p>
    }
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground">Chưa có audio nào được tạo.</p>
    }
    return (
      <div className="space-y-3">
        {items.map((item, index) => {
          const audioSrc = resolveNarrationAudioUrl(item.audioUrl)
          return (
            <Card key={`${item.languageKey || item.language}-${index}`} className="border-border">
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {resolveLanguageLabel(item.language, item.languageKey)}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(item.updatedAt)}</p>
                </div>
                {audioSrc ? (
                  <audio controls preload="none" className="w-full">
                    <source src={audioSrc} type="audio/mpeg" />
                  </audio>
                ) : (
                  <p className="text-xs text-muted-foreground">Audio URL chưa sẵn sàng.</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 p-4 md:px-6 lg:px-8">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Thuyết minh đa ngôn ngữ</h1>
            <p className="text-xs text-muted-foreground">Nhập description, chọn ngôn ngữ và tạo audio</p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 md:px-6 lg:px-8">
        {!isApproved ? (
          <Card className="border-amber-500/40 bg-amber-500/10">
            <CardContent className="p-3 text-sm text-muted-foreground">
              POI chưa duyệt: audio đang ở trạng thái nháp, chưa public cho khách.
            </CardContent>
          </Card>
        ) : null}

        {notice ? (
          <Card className="border-emerald-500/40 bg-emerald-500/10">
            <CardContent className="p-3 text-sm text-emerald-700">{notice}</CardContent>
          </Card>
        ) : null}

        {errorMessage ? (
          <Card className="border-destructive/40 bg-destructive/10">
            <CardContent className="p-3 text-sm text-destructive">{errorMessage}</CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Button variant={activeTab === "shop" ? "default" : "outline"} onClick={() => setActiveTab("shop")}>
            Audio quán
          </Button>
          <Button variant={activeTab === "dish" ? "default" : "outline"} onClick={() => setActiveTab("dish")}>
            Audio món
          </Button>
        </div>

        <Card className="border-border">
          <CardContent className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="language-select">Ngôn ngữ</Label>
              <select
                id="language-select"
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
                className="border-input bg-transparent h-10 w-full rounded-md border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                {NARRATION_LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === "shop" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="shop-description">Description của quán</Label>
                  <Textarea
                    id="shop-description"
                    value={shopDescription}
                    onChange={(event) => setShopDescription(event.target.value)}
                    className="min-h-[120px] resize-none"
                    placeholder="Nhập mô tả quán để tạo audio..."
                  />
                </div>
                <Button onClick={() => { void handleGenerateShopNarration() }} disabled={isGeneratingShopNarration}>
                  {isGeneratingShopNarration ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Tạo audio cho quán
                </Button>
                {renderNarrationList(shopNarrations, isLoadingShopNarrations)}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dish-select">Chọn món</Label>
                  <select
                    id="dish-select"
                    value={selectedDishId ?? ""}
                    onChange={(event) => setSelectedDishId(event.target.value ? Number(event.target.value) : null)}
                    className="border-input bg-transparent h-10 w-full rounded-md border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    disabled={isLoadingDishes || dishes.length === 0}
                  >
                    {dishes.length === 0 ? <option value="">Chưa có món</option> : null}
                    {dishes.map((dish) => (
                      <option key={dish.id} value={dish.id}>
                        {dish.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dish-description">Description của món</Label>
                  <Textarea
                    id="dish-description"
                    value={dishDescription}
                    onChange={(event) => setDishDescription(event.target.value)}
                    className="min-h-[120px] resize-none"
                    placeholder="Nhập mô tả món để tạo audio..."
                    disabled={!selectedDishId}
                  />
                </div>
                <Button onClick={() => { void handleGenerateDishNarration() }} disabled={isGeneratingDishNarration || !selectedDishId}>
                  {isGeneratingDishNarration ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Music2 className="mr-2 h-4 w-4" />}
                  Tạo audio cho món
                </Button>
                {renderNarrationList(dishNarrations, isLoadingDishNarrations)}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

