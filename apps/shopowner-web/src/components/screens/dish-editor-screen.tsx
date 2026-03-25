"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react"
import { createDish, deleteDish, getDishById, updateDish } from "@/services/dish-service"
import type { PoiApprovalStatus } from "@/components/app-shell"

interface DishEditorScreenProps {
  dishId: string | null
  shopId: number
  poiApprovalStatus: PoiApprovalStatus
  onBack: () => void
  onSaved: (message: string) => void
  onDeleted: (message: string) => void
}

export function DishEditorScreen({
  dishId,
  shopId,
  poiApprovalStatus,
  onBack,
  onSaved,
  onDeleted,
}: DishEditorScreenProps) {
  const numericDishId = useMemo(() => {
    if (!dishId || dishId === "new") return null
    const parsed = Number(dishId)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
  }, [dishId])

  const isNew = numericDishId === null
  const isApproved = poiApprovalStatus === "approved"

  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [isSignature, setIsSignature] = useState(false)

  const [isLoadingDish, setIsLoadingDish] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) {
      setName("")
      setPrice("")
      setDescription("")
      setIsSignature(false)
      setErrorMessage(null)
      return
    }

    let isCancelled = false
    const loadDishDetail = async () => {
      if (!numericDishId) return
      setIsLoadingDish(true)
      setErrorMessage(null)
      try {
        const dish = await getDishById(numericDishId)
        if (isCancelled) return
        setName(dish.name ?? "")
        setPrice(String(dish.price ?? ""))
        setDescription(dish.description ?? "")
        setIsSignature(Boolean(dish.isSignature))
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(error instanceof Error ? error.message : "Không thể tải thông tin món ăn.")
      } finally {
        if (!isCancelled) {
          setIsLoadingDish(false)
        }
      }
    }

    void loadDishDetail()
    return () => {
      isCancelled = true
    }
  }, [isNew, numericDishId])

  const parsePrice = (value: string): number | null => {
    if (!value.trim()) return null
    const parsed = Number(value)
    if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return null
    if (!Number.isInteger(parsed)) return null
    if (parsed < 1) return null
    return parsed
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMessage("Tên món ăn không được để trống.")
      return
    }

    const parsedPrice = parsePrice(price)
    if (parsedPrice === null) {
      setErrorMessage("Giá món phải là số nguyên lớn hơn 0.")
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    try {
      if (isNew) {
        await createDish({
          shopId,
          name: name.trim(),
          description: description.trim(),
          price: parsedPrice,
          isSignature,
        })
        onSaved("Đã thêm món ăn mới.")
      } else if (numericDishId) {
        await updateDish(numericDishId, {
          name: name.trim(),
          description: description.trim(),
          price: parsedPrice,
          isSignature,
        })
        onSaved("Đã cập nhật món ăn.")
      }
      onBack()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Lưu món ăn thất bại.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!numericDishId) return

    const shouldDelete = window.confirm("Bạn có chắc muốn xóa món ăn này?")
    if (!shouldDelete) {
      return
    }

    setIsDeleting(true)
    setErrorMessage(null)
    try {
      await deleteDish(numericDishId)
      onDeleted("Đã xóa món ăn.")
      onBack()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Xóa món ăn thất bại.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
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
          {!isNew ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                void handleDelete()
              }}
              disabled={isDeleting || isSaving}
            >
              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="px-4 py-6 pb-32 space-y-6">
        {!isApproved ? (
          <Card className="border-amber-500/40 bg-amber-500/10">
            <CardContent className="p-3 text-sm text-muted-foreground">
              POI chưa duyệt: món ăn sẽ được lưu ở dạng nháp và chưa hiển thị public.
            </CardContent>
          </Card>
        ) : null}

        {errorMessage ? (
          <Card className="border-destructive/40 bg-destructive/10">
            <CardContent className="p-3 text-sm text-destructive">{errorMessage}</CardContent>
          </Card>
        ) : null}

        {isLoadingDish ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Đang tải dữ liệu món ăn...</div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="dish-name" className="text-foreground font-medium">
                Tên món ăn
              </Label>
              <Input
                id="dish-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="VD: Ốc hương nướng mỡ hành"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dish-price" className="text-foreground font-medium">
                Giá (VNĐ)
              </Label>
              <Input
                id="dish-price"
                type="number"
                min="1"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="180000"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dish-description" className="text-foreground font-medium">
                Mô tả món ăn
              </Label>
              <Textarea
                id="dish-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Mô tả ngắn về món ăn, hương vị, cách chế biến..."
                className="min-h-[120px] resize-none"
              />
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Món nổi bật</p>
                  <p className="text-sm text-muted-foreground">
                    Đánh dấu để ưu tiên hiển thị ở danh sách món ăn.
                  </p>
                </div>
                <Switch
                  checked={isSignature}
                  onCheckedChange={setIsSignature}
                  className="data-[state=checked]:bg-primary"
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-md mx-auto">
          <Button
            className="w-full h-12 text-base font-semibold gap-2"
            onClick={() => {
              void handleSave()
            }}
            disabled={isLoadingDish || isSaving || isDeleting}
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isApproved ? (isNew ? "Thêm món ăn" : "Lưu thay đổi") : "Lưu nháp"}
          </Button>
        </div>
      </div>
    </div>
  )
}
