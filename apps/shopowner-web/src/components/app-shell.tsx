"use client"

import { useEffect, useState } from "react"
import { BottomNavigation } from "./bottom-navigation"
import { DashboardScreen } from "./screens/dashboard-screen"
import { MenuScreen } from "./screens/menu-screen"
import { QRScreen } from "./screens/qr-screen"
import { InsightsScreen } from "./screens/insights-screen"
import { ShopProfileScreen } from "./screens/shop-profile-screen"
import { DishEditorScreen } from "./screens/dish-editor-screen"
import { AudioManagementScreen } from "./screens/audio-management-screen"
import { ApprovalHistoryScreen } from "./screens/approval-history-screen"
import { getPoiApprovalSummary, submitPoiRegistration } from "@/services/poi-approval-service"
import { createShop, getMyShop, getShopTypes, updateMyShop, type CreateShopPayload, type ShopTypeOption } from "@/services/shop-service"
import { previewPoiModeration } from "@/services/poi-moderation-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { parseFlexibleCoordinates } from "@/lib/coordinates"

type Screen = 
  | "dashboard" 
  | "menu" 
  | "qr" 
  | "insights" 
  | "shop-profile" 
  | "dish-editor"
  | "audio-management"
  | "approval-history"

type Tab = "dashboard" | "menu" | "qr" | "insights"

interface AppShellProps {
  initialScreen?: Screen
  onLogout: () => void
}

export type PoiApprovalStatus = "unregistered" | "pending" | "approved" | "rejected"

export interface ApprovalHistoryItem {
  id: string
  submittedAt: string
  status: Exclude<PoiApprovalStatus, "unregistered">
  reviewer?: string
  reviewedAt?: string
  reason?: string
}

type AppNotice = {
  type: "success" | "error" | "info"
  message: string
}

const OWNER_DRAFT_SHOP_NAME_KEY = "owner_draft_shop_name"
const DEFAULT_CREATE_SHOP_AVG_COST = 90000
const DEFAULT_CREATE_SHOP_AVG_WAIT_TIME = 10
const DEFAULT_CREATE_SHOP_AVG_EAT_TIME = 30

type ShopCategoryKey = "hai_san" | "lau" | "do_nuong" | "com" | "pho" | "giai_khat"

const SHOP_CATEGORIES: Array<{ key: ShopCategoryKey; label: string; matchers: string[] }> = [
  { key: "hai_san", label: "Hải sản", matchers: ["hai san", "seafood", "oc"] },
  { key: "lau", label: "Lẩu", matchers: ["lau", "hotpot", "hot pot"] },
  { key: "do_nuong", label: "Đồ nướng", matchers: ["do nuong", "nuong", "bbq", "grill"] },
  { key: "com", label: "Cơm", matchers: ["com", "rice"] },
  { key: "pho", label: "Phở", matchers: ["pho", "noodle", "bun", "hu tieu", "mi"] },
  { key: "giai_khat", label: "Giải khát", matchers: ["giai khat", "drink", "beverage", "tra", "coffee"] },
]

function normalizeCategoryText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function createEmptyShopTypeIdByCategory(): Record<ShopCategoryKey, number | null> {
  return {
    hai_san: null,
    lau: null,
    do_nuong: null,
    com: null,
    pho: null,
    giai_khat: null,
  }
}

function resolveShopTypeIdByCategory(shopTypes: ShopTypeOption[]): Record<ShopCategoryKey, number | null> {
  const resolved = createEmptyShopTypeIdByCategory()

  for (const category of SHOP_CATEGORIES) {
    const matchedType = shopTypes.find((type) => {
      const normalizedName = normalizeCategoryText(type.name || "")
      return category.matchers.some((matcher) => normalizedName.includes(matcher))
    })
    resolved[category.key] = matchedType?.id ?? null
  }

  return resolved
}

function consumeDraftShopName(): string {
  if (typeof window === "undefined") {
    return ""
  }
  const draft = window.localStorage.getItem(OWNER_DRAFT_SHOP_NAME_KEY) || ""
  if (draft) {
    window.localStorage.removeItem(OWNER_DRAFT_SHOP_NAME_KEY)
  }
  return draft
}

export function AppShell({ initialScreen = "dashboard", onLogout }: AppShellProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>(initialScreen)
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null)
  const [poiApprovalStatus, setPoiApprovalStatus] = useState<PoiApprovalStatus>("unregistered")
  const [rejectionReason, setRejectionReason] = useState("")
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryItem[]>([])
  const [shopId, setShopId] = useState<number | null>(null)
  const [shopName, setShopName] = useState("Quán của tôi")
  const [shopAddress, setShopAddress] = useState("")
  const [shopDescription, setShopDescription] = useState("")
  const [shopLat, setShopLat] = useState<number | null>(null)
  const [shopLng, setShopLng] = useState<number | null>(null)
  const [dishReloadToken, setDishReloadToken] = useState(0)
  const [isSavingShop, setIsSavingShop] = useState(false)
  const [isCreatingShop, setIsCreatingShop] = useState(false)
  const [isLoadingOwnerContext, setIsLoadingOwnerContext] = useState(true)
  const [notice, setNotice] = useState<AppNotice | null>(null)
  const [createShopName, setCreateShopName] = useState(() => consumeDraftShopName())
  const [createShopAddress, setCreateShopAddress] = useState("")
  const [createShopDescription, setCreateShopDescription] = useState("")
  const [createShopCategoryKey, setCreateShopCategoryKey] = useState<ShopCategoryKey>("hai_san")
  const [shopTypeIdByCategory, setShopTypeIdByCategory] = useState<Record<ShopCategoryKey, number | null>>(
    createEmptyShopTypeIdByCategory()
  )
  const [hasShopTypeLoadError, setHasShopTypeLoadError] = useState(false)
  const [createShopLat, setCreateShopLat] = useState("10.7612")
  const [createShopLng, setCreateShopLng] = useState("106.7033")
  const [createShopCoordinateRaw, setCreateShopCoordinateRaw] = useState("")

  const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error && error.message) {
      return error.message
    }
    return fallback
  }

  const loadApprovalSummary = async (resolvedShopId: number) => {
    try {
      const summary = await getPoiApprovalSummary(resolvedShopId)
      setPoiApprovalStatus(summary.status)
      setRejectionReason(summary.rejectionReason)
      setApprovalHistory(summary.history)
    } catch {
      setPoiApprovalStatus("unregistered")
      setRejectionReason("")
      setApprovalHistory([])
    }
  }

  const loadShopTypes = async () => {
    try {
      const types = await getShopTypes()
      const resolved = resolveShopTypeIdByCategory(types)
      setShopTypeIdByCategory(resolved)
      setHasShopTypeLoadError(false)
      setCreateShopCategoryKey((current) => {
        if (resolved[current] !== null) {
          return current
        }
        const fallbackCategory = SHOP_CATEGORIES.find((category) => resolved[category.key] !== null)
        return fallbackCategory?.key ?? current
      })
    } catch {
      // Fallback: backend still accepts omitted shopTypeId and chooses default type.
      setShopTypeIdByCategory(createEmptyShopTypeIdByCategory())
      setHasShopTypeLoadError(true)
    }
  }

  const parseNumberInput = (value: string): number | null => {
    if (!value.trim()) {
      return null
    }
    const parsed = Number(value)
    if (Number.isNaN(parsed)) {
      return null
    }
    return parsed
  }

  const loadOwnerContext = async () => {
    setIsLoadingOwnerContext(true)
    try {
      const shop = await getMyShop()
      setShopId(shop.id)
      setShopName(shop.name || "Quán của tôi")
      setShopAddress(shop.address || "")
      setShopDescription(shop.description || "")
      setShopLat(typeof shop.lat === "number" ? shop.lat : null)
      setShopLng(typeof shop.lng === "number" ? shop.lng : null)
      await loadApprovalSummary(shop.id)
      setNotice(null)
    } catch (error) {
      setShopId(null)
      setShopLat(null)
      setShopLng(null)
      setPoiApprovalStatus("unregistered")
      setRejectionReason("")
      setApprovalHistory([])

      const message = getErrorMessage(error, "Không thể tải thông tin cửa hàng.")
      if (message.toLowerCase().includes("shop not found")) {
        setNotice({
          type: "info",
          message: "Tài khoản hiện chưa có cửa hàng. Bạn có thể tạo cửa hàng mới ngay bên dưới.",
        })
      } else {
        setNotice({
          type: "error",
          message,
        })
      }
    } finally {
      setIsLoadingOwnerContext(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNotice((current) => (current?.type === "success" ? null : current))
    }, 2500)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    void loadOwnerContext()
    void loadShopTypes()
  }, [])

  const getActiveTab = (): Tab => {
    switch (currentScreen) {
      case "dashboard":
      case "shop-profile":
      case "approval-history":
        return "dashboard"
      case "menu":
      case "dish-editor":
        return "menu"
      case "qr":
      case "audio-management":
        return "qr"
      case "insights":
        return "insights"
      default:
        return "dashboard"
    }
  }

  const handleTabChange = (tab: Tab) => {
    if (!shopId && tab !== "dashboard") {
      setNotice({
        type: "info",
        message: "Tài khoản chưa có dữ liệu cửa hàng, hiện chỉ xem được màn hình tổng quan.",
      })
      setCurrentScreen("dashboard")
      return
    }
    setCurrentScreen(tab)
  }

  const navigateTo = (screen: Screen, dishId?: string) => {
    const requiresShop = screen !== "dashboard"
    if (!shopId && requiresShop) {
      setNotice({
        type: "info",
        message: "Cần có cửa hàng trước khi dùng chức năng này.",
      })
      setCurrentScreen("dashboard")
      return
    }
    if (dishId) setSelectedDishId(dishId)
    setCurrentScreen(screen)
  }

  const handleCreateShop = async () => {
    if (!createShopName.trim() || !createShopAddress.trim() || !createShopDescription.trim()) {
      setNotice({
        type: "error",
        message: "Vui lòng nhập đủ tên quán, địa chỉ và mô tả.",
      })
      return
    }

    let lat: number | null = null
    let lng: number | null = null

    if (createShopCoordinateRaw.trim()) {
      const parsedCoordinates = parseFlexibleCoordinates(createShopCoordinateRaw)
      if (!parsedCoordinates) {
        setNotice({
          type: "error",
          message:
            "Không đọc được tọa độ. Hãy nhập dạng DMS (N/E/W/S) hoặc dạng số thập phân `lat, lng`.",
        })
        return
      }
      lat = parsedCoordinates.lat
      lng = parsedCoordinates.lng
      setCreateShopLat(parsedCoordinates.lat.toFixed(8))
      setCreateShopLng(parsedCoordinates.lng.toFixed(8))
    } else {
      lat = parseNumberInput(createShopLat)
      if (lat === null || lat < -90 || lat > 90) {
        setNotice({
          type: "error",
          message: "Vĩ độ không hợp lệ. Giá trị hợp lệ từ -90 đến 90.",
        })
        return
      }

      lng = parseNumberInput(createShopLng)
      if (lng === null || lng < -180 || lng > 180) {
        setNotice({
          type: "error",
          message: "Kinh độ không hợp lệ. Giá trị hợp lệ từ -180 đến 180.",
        })
        return
      }
    }

    if (lat === null || lng === null) {
      setNotice({
        type: "error",
        message: "Không xác định được tọa độ cửa hàng.",
      })
      return
    }

    try {
      const moderationPreview = await previewPoiModeration({
        name: createShopName.trim(),
        address: createShopAddress.trim(),
        description: createShopDescription.trim(),
        category: SHOP_CATEGORIES.find((category) => category.key === createShopCategoryKey)?.label,
      })
      if (moderationPreview.decision === "BLOCK") {
        setNotice({
          type: "error",
          message: moderationPreview.message || "Mô tả có dấu hiệu nhạy cảm, vui lòng chỉnh sửa trước khi tạo quán.",
        })
        return
      }
      if (moderationPreview.decision === "WARN") {
        setNotice({
          type: "info",
          message: moderationPreview.message || "Mô tả có dấu hiệu chưa phù hợp, bạn nên chỉnh sửa trước khi gửi duyệt.",
        })
      }
    } catch {
      setNotice({
        type: "info",
        message: "Không kiểm tra được nội dung tự động. Hệ thống vẫn tiếp tục tạo quán và sẽ kiểm duyệt ở bước sau.",
      })
    }

    const payload: CreateShopPayload = {
      name: createShopName.trim(),
      address: createShopAddress.trim(),
      description: createShopDescription.trim(),
      lat,
      lng,
      avgCostPerPerson: DEFAULT_CREATE_SHOP_AVG_COST,
      avgWaitTimeMin: DEFAULT_CREATE_SHOP_AVG_WAIT_TIME,
      avgEatTimeMin: DEFAULT_CREATE_SHOP_AVG_EAT_TIME,
    }

    const selectedShopTypeId = shopTypeIdByCategory[createShopCategoryKey]
    if (selectedShopTypeId !== null) {
      payload.shopTypeId = selectedShopTypeId
    } else if (hasShopTypeLoadError) {
      setNotice({
        type: "error",
        message: "Không tải được loại cửa hàng từ backend. Vui lòng thử lại.",
      })
      return
    } else {
      const selectedCategoryLabel =
        SHOP_CATEGORIES.find((category) => category.key === createShopCategoryKey)?.label ?? "đã chọn"
      setNotice({
        type: "error",
        message: `Loại cửa hàng "${selectedCategoryLabel}" chưa được cấu hình trên backend.`,
      })
      return
    }

    setIsCreatingShop(true)
    try {
      const createdShop = await createShop(payload)
      let isSubmittedToAdmin = false
      let submitWarningMessage: string | null = null
      try {
        await submitPoiRegistration(createdShop.id)
        isSubmittedToAdmin = true
      } catch (submitError) {
        submitWarningMessage = getErrorMessage(
          submitError,
          "Đã tạo cửa hàng. Vui lòng vào Hồ sơ quán để gửi đăng ký POI.",
        )
      }

      await loadOwnerContext()
      setCurrentScreen("dashboard")
      if (isSubmittedToAdmin) {
        setNotice({
          type: "success",
          message: "Đã tạo cửa hàng và gửi đăng ký POI. Admin có thể bắt đầu duyệt.",
        })
      } else if (submitWarningMessage) {
        setNotice({
          type: "info",
          message: submitWarningMessage,
        })
      } else {
        setNotice({
          type: "success",
          message: "Đã tạo cửa hàng thành công.",
        })
      }
    } catch (error) {
      setNotice({
        type: "error",
        message: getErrorMessage(error, "Tạo cửa hàng thất bại."),
      })
    } finally {
      setIsCreatingShop(false)
    }
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "dashboard":
        return (
          <DashboardScreen
            onNavigate={navigateTo}
            poiApprovalStatus={poiApprovalStatus}
            rejectionReason={rejectionReason}
            onLogout={onLogout}
            shopName={shopName}
            shopAddress={shopAddress}
          />
        )
      case "menu":
        return (
          <MenuScreen
            onNavigate={navigateTo}
            poiApprovalStatus={poiApprovalStatus}
            shopId={shopId ?? 0}
            reloadToken={dishReloadToken}
          />
        )
      case "qr":
        return <QRScreen onNavigate={navigateTo} shopId={shopId ?? 0} shopName={shopName} />
      case "insights":
        return <InsightsScreen />
      case "shop-profile":
        return (
          <ShopProfileScreen
            onBack={() => setCurrentScreen("dashboard")}
            poiApprovalStatus={poiApprovalStatus}
            rejectionReason={rejectionReason}
            onLogout={onLogout}
            initialShopName={shopName}
            initialShopAddress={shopAddress}
            initialShopDescription={shopDescription}
            initialShopLat={shopLat}
            initialShopLng={shopLng}
            isSaving={isSavingShop}
            onSaveShop={async (payload) => {
              if (!payload.name.trim() || !payload.address.trim()) {
                setNotice({
                  type: "error",
                  message: "Tên quán và địa chỉ không được để trống.",
                })
                return
              }
              setIsSavingShop(true)
              try {
                const updatedShop = await updateMyShop(payload)
                setShopId(updatedShop.id)
                setShopName(updatedShop.name || "Quán của tôi")
                setShopAddress(updatedShop.address || "")
                setShopDescription(updatedShop.description || "")
                setShopLat(typeof updatedShop.lat === "number" ? updatedShop.lat : null)
                setShopLng(typeof updatedShop.lng === "number" ? updatedShop.lng : null)
                await loadApprovalSummary(updatedShop.id)
                setNotice({
                  type: "success",
                  message: "Đã lưu thông tin cửa hàng. Nội dung mới đã được đưa về hàng chờ admin duyệt.",
                })
              } catch (error) {
                setNotice({
                  type: "error",
                  message: getErrorMessage(error, "Lưu thông tin thất bại."),
                })
              } finally {
                setIsSavingShop(false)
              }
            }}
            onSubmitPoiRegistration={() => {
              if (!shopId) {
                setNotice({
                  type: "error",
                  message: "Không tìm thấy cửa hàng để gửi duyệt.",
                })
                return
              }
              void submitPoiRegistration(shopId)
                .then((summary) => {
                  setPoiApprovalStatus(summary.status)
                  setRejectionReason(summary.rejectionReason)
                  setApprovalHistory(summary.history)
                  setNotice({
                    type: "success",
                    message: "Đã gửi yêu cầu duyệt POI. Admin sẽ thấy mục này để xem xét.",
                  })
                })
                .catch((error) => {
                  setNotice({
                    type: "error",
                    message: getErrorMessage(error, "Gửi yêu cầu duyệt thất bại."),
                  })
                })
            }}
            onViewApprovalHistory={() => setCurrentScreen("approval-history")}
          />
        )
      case "dish-editor":
        return (
          <DishEditorScreen 
            dishId={selectedDishId} 
            shopId={shopId ?? 0}
            poiApprovalStatus={poiApprovalStatus}
            onBack={() => setCurrentScreen("menu")}
            onSaved={(message) => {
              setDishReloadToken((current) => current + 1)
              setNotice({
                type: "success",
                message,
              })
            }}
            onDeleted={(message) => {
              setDishReloadToken((current) => current + 1)
              setNotice({
                type: "success",
                message,
              })
            }}
          />
        )
      case "audio-management":
        return (
          <AudioManagementScreen
            onBack={() => setCurrentScreen("qr")}
            poiApprovalStatus={poiApprovalStatus}
          />
        )
      case "approval-history":
        return (
          <ApprovalHistoryScreen
            onBack={() => setCurrentScreen("shop-profile")}
            history={approvalHistory}
          />
        )
      default:
        return (
          <DashboardScreen
            onNavigate={navigateTo}
            poiApprovalStatus={poiApprovalStatus}
            rejectionReason={rejectionReason}
            onLogout={onLogout}
            shopName={shopName}
            shopAddress={shopAddress}
          />
        )
    }
  }

  if (isLoadingOwnerContext) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu cửa hàng...</p>
        </div>
      </div>
    )
  }

  if (!shopId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full rounded-2xl border bg-card p-5 space-y-4">
          <h2 className="text-lg font-semibold">Chưa có dữ liệu cửa hàng</h2>
          <p className="text-sm text-muted-foreground">
            {notice?.message ||
              "Tài khoản chưa được liên kết với cửa hàng hoặc backend chưa sẵn sàng."}
          </p>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="create-shop-name">Tên cửa hàng</Label>
              <Input
                id="create-shop-name"
                value={createShopName}
                onChange={(event) => setCreateShopName(event.target.value)}
                placeholder="Ví dụ: Quán Ốc Bà Sáu"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-shop-address">Địa chỉ</Label>
              <Input
                id="create-shop-address"
                value={createShopAddress}
                onChange={(event) => setCreateShopAddress(event.target.value)}
                placeholder="Ví dụ: 45 Vĩnh Khánh, Quận 4, TP.HCM"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-shop-description">Mô tả cửa hàng</Label>
              <Textarea
                id="create-shop-description"
                value={createShopDescription}
                onChange={(event) => setCreateShopDescription(event.target.value)}
                className="min-h-[96px] resize-none"
                placeholder="Nhập mô tả ngắn về quán..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-shop-type">Loại cửa hàng</Label>
              <select
                id="create-shop-type"
                value={createShopCategoryKey}
                onChange={(event) => setCreateShopCategoryKey(event.target.value as ShopCategoryKey)}
                className="border-input bg-transparent h-10 w-full rounded-md border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                {SHOP_CATEGORIES.map((category) => (
                  <option
                    key={category.key}
                    value={category.key}
                    disabled={shopTypeIdByCategory[category.key] === null}
                  >
                    {category.label}
                    {shopTypeIdByCategory[category.key] === null ? " (chưa cấu hình)" : ""}
                  </option>
                ))}
              </select>
              {hasShopTypeLoadError ? (
                <p className="text-xs text-muted-foreground">
                  Không tải được danh sách loại quán. Vui lòng bấm Tải lại hoặc kiểm tra backend.
                </p>
              ) : SHOP_CATEGORIES.some((category) => shopTypeIdByCategory[category.key] === null) ? (
                <p className="text-xs text-muted-foreground">
                  Một số loại quán chưa có trên backend:
                  {" "}
                  {SHOP_CATEGORIES.filter((category) => shopTypeIdByCategory[category.key] === null)
                    .map((category) => category.label)
                    .join(", ")}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-shop-coordinate-raw">
                Tọa độ dán nhanh (hỗ trợ DMS và số thập phân)
              </Label>
              <Input
                id="create-shop-coordinate-raw"
                value={createShopCoordinateRaw}
                onChange={(event) => setCreateShopCoordinateRaw(event.target.value)}
                placeholder={`Ví dụ: 10°46'42.0"N 106°39'47.8"E hoặc 10.761486715909173, 106.68095304761832`}
              />
              <p className="text-xs text-muted-foreground">
                Nếu bạn điền ô này, hệ thống sẽ tự đổi ra vĩ độ/kinh độ bên dưới.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-shop-lat">Vĩ độ</Label>
                <Input
                  id="create-shop-lat"
                  type="number"
                  step="any"
                  value={createShopLat}
                  onChange={(event) => setCreateShopLat(event.target.value)}
                  placeholder="10.7612"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-shop-lng">Kinh độ</Label>
                <Input
                  id="create-shop-lng"
                  type="number"
                  step="any"
                  value={createShopLng}
                  onChange={(event) => setCreateShopLng(event.target.value)}
                  placeholder="106.7033"
                />
              </div>
            </div>
            <Button className="w-full" onClick={() => { void handleCreateShop() }} disabled={isCreatingShop}>
              {isCreatingShop ? "Đang tạo cửa hàng..." : "Tạo cửa hàng mới"}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { void loadOwnerContext() }}>
              Tải lại
            </Button>
            <Button variant="destructive" className="flex-1" onClick={onLogout}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const usesWideDesktopLayout = currentScreen === "shop-profile"
  const contentContainerClass = usesWideDesktopLayout
    ? "relative mx-auto max-w-md pb-24 md:max-w-none"
    : "relative mx-auto max-w-md pb-24"

  return (
    <div className="min-h-screen bg-background">
      <div className={contentContainerClass}>
        {notice ? (
          <div
            className={`mx-3 mt-3 rounded-lg border px-3 py-2 text-sm ${
              notice.type === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : notice.type === "error"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-blue-300 bg-blue-50 text-blue-700"
            }`}
          >
            {notice.message}
          </div>
        ) : null}
        {renderScreen()}
      </div>
      <BottomNavigation activeTab={getActiveTab()} onTabChange={handleTabChange} />
    </div>
  )
}
