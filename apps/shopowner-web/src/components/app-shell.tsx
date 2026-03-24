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
import { createShop, getMyShop, updateMyShop } from "@/services/shop-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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
  const [isSavingShop, setIsSavingShop] = useState(false)
  const [isCreatingShop, setIsCreatingShop] = useState(false)
  const [isLoadingOwnerContext, setIsLoadingOwnerContext] = useState(true)
  const [notice, setNotice] = useState<AppNotice | null>(null)
  const [createShopName, setCreateShopName] = useState("")
  const [createShopAddress, setCreateShopAddress] = useState("")
  const [createShopDescription, setCreateShopDescription] = useState("")

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

  const loadOwnerContext = async () => {
    setIsLoadingOwnerContext(true)
    try {
      const shop = await getMyShop()
      setShopId(shop.id)
      setShopName(shop.name || "Quán của tôi")
      setShopAddress(shop.address || "")
      setShopDescription(shop.description || "")
      await loadApprovalSummary(shop.id)
      setNotice(null)
    } catch (error) {
      setShopId(null)
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

    setIsCreatingShop(true)
    try {
      await createShop({
        name: createShopName.trim(),
        address: createShopAddress.trim(),
        description: createShopDescription.trim(),
        lat: 10.7612,
        lng: 106.7033,
        avgCostPerPerson: 90000,
        avgWaitTimeMin: 10,
        avgEatTimeMin: 30,
        shopTypeId: 1,
      })
      await loadOwnerContext()
      setCurrentScreen("dashboard")
      setNotice({
        type: "success",
        message: "Đã tạo cửa hàng thành công.",
      })
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
        return <MenuScreen onNavigate={navigateTo} poiApprovalStatus={poiApprovalStatus} />
      case "qr":
        return <QRScreen onNavigate={navigateTo} />
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
                setNotice({
                  type: "success",
                  message: "Đã lưu thông tin cửa hàng.",
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
                    message: "Đã gửi yêu cầu duyệt POI.",
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
            poiApprovalStatus={poiApprovalStatus}
            onBack={() => setCurrentScreen("menu")} 
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto relative pb-24">
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
