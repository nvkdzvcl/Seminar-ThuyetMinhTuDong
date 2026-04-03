"use client"

import { useEffect, useState } from "react"
import { BarChart3, LayoutDashboard, QrCode, ReceiptText, Store, UtensilsCrossed } from "lucide-react"
import { BottomNavigation } from "./bottom-navigation"
import { DashboardScreen } from "./screens/dashboard-screen"
import { MenuScreen } from "./screens/menu-screen"
import { QRScreen } from "./screens/qr-screen"
import { InsightsScreen } from "./screens/insights-screen"
import { ShopProfileScreen } from "./screens/shop-profile-screen"
import { DishEditorScreen } from "./screens/dish-editor-screen"
import { AudioManagementScreen } from "./screens/audio-management-screen"
import { ApprovalHistoryScreen } from "./screens/approval-history-screen"
import { OrderManagementScreen } from "./screens/order-management-screen"
import { getPoiApprovalSummary, submitPoiRegistration } from "@/services/poi-approval-service"
import { createShop, getMyShop, getShopTypes, updateMyShop, type CreateShopPayload, type ShopTypeOption } from "@/services/shop-service"
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
  | "order-management"
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
const POI_SUBMIT_MAX_ATTEMPTS = 3
const POI_SUBMIT_RETRY_DELAYS_MS = [1500, 3500]

type ShopCategoryKey = "hai_san" | "lau" | "do_nuong" | "com" | "pho" | "giai_khat"

const SHOP_CATEGORIES: Array<{ key: ShopCategoryKey; label: string; matchers: string[] }> = [
  { key: "hai_san", label: "Hải sản", matchers: ["hai san", "seafood", "oc"] },
  { key: "lau", label: "Lẩu", matchers: ["lau", "hotpot", "hot pot"] },
  { key: "do_nuong", label: "Đồ nướng", matchers: ["do nuong", "nuong", "bbq", "grill"] },
  { key: "com", label: "Cơm", matchers: ["com", "rice"] },
  { key: "pho", label: "Phở", matchers: ["pho", "noodle", "bun", "hu tieu", "mi"] },
  { key: "giai_khat", label: "Giải khát", matchers: ["giai khat", "drink", "beverage", "tra", "coffee"] },
]

const DESKTOP_NAV_ITEMS: Array<{
  id: "dashboard" | "menu" | "qr" | "insights" | "order-management" | "shop-profile"
  label: string
  icon: typeof LayoutDashboard
}> = [
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "menu", label: "Thực đơn", icon: UtensilsCrossed },
  { id: "order-management", label: "Đơn hàng", icon: ReceiptText },
  { id: "qr", label: "Mã QR", icon: QrCode },
  { id: "insights", label: "Thống kê", icon: BarChart3 },
  { id: "shop-profile", label: "Hồ sơ quán", icon: Store },
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
  const [shopShortDescription, setShopShortDescription] = useState("")
  const [shopDetailedDescription, setShopDetailedDescription] = useState("")
  const [shopLat, setShopLat] = useState<number | null>(null)
  const [shopLng, setShopLng] = useState<number | null>(null)
  const [dishReloadToken, setDishReloadToken] = useState(0)
  const [isSavingShop, setIsSavingShop] = useState(false)
  const [isCreatingShop, setIsCreatingShop] = useState(false)
  const [isSubmittingPoiApproval, setIsSubmittingPoiApproval] = useState(false)
  const [poiSubmitProgressMessage, setPoiSubmitProgressMessage] = useState<string | null>(null)
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
      if (!shop) {
        setShopId(null)
        setShopShortDescription("")
        setShopDetailedDescription("")
        setShopLat(null)
        setShopLng(null)
        setPoiApprovalStatus("unregistered")
        setRejectionReason("")
        setApprovalHistory([])
        setNotice({
          type: "info",
          message: "Tài khoản hiện chưa có cửa hàng. Bạn có thể tạo cửa hàng mới ngay bên dưới.",
        })
        return
      }
      setShopId(shop.id)
      setShopName(shop.name || "Quán của tôi")
      setShopAddress(shop.address || "")
      const resolvedDetailedDescription = shop.detailedDescription || shop.description || ""
      const resolvedShortDescription = shop.shortDescription || resolvedDetailedDescription.slice(0, 140)
      setShopDetailedDescription(resolvedDetailedDescription)
      setShopShortDescription(resolvedShortDescription)
      setShopLat(typeof shop.lat === "number" ? shop.lat : null)
      setShopLng(typeof shop.lng === "number" ? shop.lng : null)
      await loadApprovalSummary(shop.id)
      setNotice(null)
    } catch (error) {
      setShopId(null)
      setShopShortDescription("")
      setShopDetailedDescription("")
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
      case "order-management":
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

  const isDesktopMainScreen =
    currentScreen === "dashboard" ||
    currentScreen === "menu" ||
    currentScreen === "qr" ||
    currentScreen === "insights" ||
    currentScreen === "order-management" ||
    currentScreen === "shop-profile"

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

  const waitForRetry = (delayMs: number) =>
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, delayMs)
    })

  const submitPoiRegistrationWithRetry = async (
    targetShopId: number,
    source: "auto-after-create" | "manual",
  ) => {
    if (isSubmittingPoiApproval) {
      setNotice({
        type: "info",
        message: "Hệ thống đang gửi duyệt POI. Vui lòng chờ trong giây lát.",
      })
      return
    }

    setIsSubmittingPoiApproval(true)
    try {
      for (let attempt = 1; attempt <= POI_SUBMIT_MAX_ATTEMPTS; attempt += 1) {
        setPoiSubmitProgressMessage(`Đang gửi duyệt POI... (lần ${attempt}/${POI_SUBMIT_MAX_ATTEMPTS})`)
        try {
          const summary = await submitPoiRegistration(targetShopId)
          setPoiApprovalStatus(summary.status)
          setRejectionReason(summary.rejectionReason)
          setApprovalHistory(summary.history)
          if (summary.status === "rejected") {
            setNotice({
              type: "error",
              message: summary.rejectionReason || "POI bị AI gắn cờ. Vui lòng chỉnh sửa mô tả rồi gửi duyệt lại.",
            })
            return
          }
          setNotice({
            type: "success",
            message:
              source === "auto-after-create"
                ? "Đã gửi đăng ký POI cho admin. Bạn có thể theo dõi trạng thái ở Hồ sơ quán."
                : "Đã gửi yêu cầu duyệt POI. Admin sẽ thấy mục này để xem xét.",
          })
          return
        } catch (submitError) {
          if (attempt >= POI_SUBMIT_MAX_ATTEMPTS) {
            const fallbackMessage =
              source === "auto-after-create"
                ? "Đã tạo cửa hàng. Vui lòng vào Hồ sơ quán để gửi đăng ký POI."
                : "Gửi yêu cầu duyệt thất bại."
            setNotice({
              type: "info",
              message: getErrorMessage(submitError, fallbackMessage),
            })
            return
          }

          const retryDelayMs = POI_SUBMIT_RETRY_DELAYS_MS[Math.min(attempt - 1, POI_SUBMIT_RETRY_DELAYS_MS.length - 1)]
          setPoiSubmitProgressMessage(
            `Kết nối tạm lỗi, sẽ tự thử lại sau ${Math.ceil(retryDelayMs / 1000)} giây... (lần ${attempt}/${POI_SUBMIT_MAX_ATTEMPTS})`,
          )
          await waitForRetry(retryDelayMs)
        }
      }
    } finally {
      setPoiSubmitProgressMessage(null)
      setIsSubmittingPoiApproval(false)
    }
  }

  const handleCreateShop = async () => {
    if (isCreatingShop) {
      return
    }
    setIsCreatingShop(true)

    try {
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

      const payload: CreateShopPayload = {
        name: createShopName.trim(),
        address: createShopAddress.trim(),
        shortDescription: createShopDescription.trim().slice(0, 140),
        detailedDescription: createShopDescription.trim(),
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

      const createdShop = await createShop(payload)
      await loadOwnerContext()
      setCurrentScreen("dashboard")
      setNotice({
        type: "success",
        message: "Đã tạo cửa hàng thành công. Hệ thống đang gửi đăng ký POI để admin duyệt...",
      })

      void submitPoiRegistrationWithRetry(createdShop.id, "auto-after-create")
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
        return <QRScreen shopId={shopId ?? 0} shopName={shopName} />
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
            initialShortDescription={shopShortDescription}
            initialDetailedDescription={shopDetailedDescription}
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
                const resolvedDetailedDescription = updatedShop.detailedDescription || updatedShop.description || ""
                const resolvedShortDescription = updatedShop.shortDescription || resolvedDetailedDescription.slice(0, 140)
                setShopDetailedDescription(resolvedDetailedDescription)
                setShopShortDescription(resolvedShortDescription)
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
              void submitPoiRegistrationWithRetry(shopId, "manual")
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
            shopId={shopId ?? 0}
            initialShopDescription={shopDetailedDescription}
          />
        )
      case "order-management":
        return <OrderManagementScreen shopId={shopId ?? 0} />
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
      <div className="min-h-screen bg-background px-4 py-8 md:px-6 md:py-12 lg:px-8">
        <div className="mx-auto w-full max-w-6xl rounded-2xl border bg-card p-5 space-y-4 md:p-6">
          <h2 className="text-lg font-semibold">Chưa có dữ liệu cửa hàng</h2>
          <p className="text-sm text-muted-foreground">
            {notice?.message ||
              "Tài khoản chưa được liên kết với cửa hàng hoặc backend chưa sẵn sàng."}
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="create-shop-name">Tên cửa hàng</Label>
              <Input
                id="create-shop-name"
                value={createShopName}
                onChange={(event) => setCreateShopName(event.target.value)}
                placeholder="Ví dụ: Quán Ốc Bà Sáu"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="create-shop-address">Địa chỉ</Label>
              <Input
                id="create-shop-address"
                value={createShopAddress}
                onChange={(event) => setCreateShopAddress(event.target.value)}
                placeholder="Ví dụ: 45 Vĩnh Khánh, Quận 4, TP.HCM"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
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
            <div className="grid grid-cols-2 gap-3 md:col-span-2">
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
            <Button className="w-full md:col-span-2 md:max-w-sm" onClick={() => { void handleCreateShop() }} disabled={isCreatingShop}>
              {isCreatingShop ? "Đang tạo cửa hàng..." : "Tạo cửa hàng mới"}
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 md:max-w-sm">
            <Button variant="outline" onClick={() => { void loadOwnerContext() }}>
              Tải lại
            </Button>
            <Button variant="destructive" onClick={onLogout}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {isDesktopMainScreen ? (
        <div className="sticky top-0 z-20 hidden border-b bg-background/95 backdrop-blur md:block">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Shop Owner Portal</p>
              <p className="truncate text-sm font-semibold text-foreground">{shopName}</p>
            </div>
            <div className="flex items-center gap-1">
              {DESKTOP_NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = currentScreen === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={
                      isActive
                        ? "inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm text-primary-foreground"
                        : "inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative mx-auto w-full max-w-7xl pb-24 md:pb-10">
        {notice ? (
          <div
            className={`mx-4 mt-3 rounded-lg border px-3 py-2 text-sm md:mx-6 lg:mx-8 ${
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
        {poiSubmitProgressMessage ? (
          <div className="mx-4 mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 md:mx-6 lg:mx-8">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              <span>{poiSubmitProgressMessage}</span>
            </div>
          </div>
        ) : null}
        {renderScreen()}
      </div>
      <BottomNavigation activeTab={getActiveTab()} onTabChange={handleTabChange} />
    </div>
  )
}
