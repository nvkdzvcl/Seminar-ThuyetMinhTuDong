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

export function AppShell({ initialScreen = "dashboard" }: AppShellProps) {
  const CURRENT_SHOP_ID = 3
  const [currentScreen, setCurrentScreen] = useState<Screen>(initialScreen)
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null)
  const [poiApprovalStatus, setPoiApprovalStatus] = useState<PoiApprovalStatus>("unregistered")
  const [rejectionReason, setRejectionReason] = useState("")
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryItem[]>([])

  const loadApprovalSummary = async () => {
    try {
      const summary = await getPoiApprovalSummary(CURRENT_SHOP_ID)
      setPoiApprovalStatus(summary.status)
      setRejectionReason(summary.rejectionReason)
      setApprovalHistory(summary.history)
    } catch {
      setPoiApprovalStatus("unregistered")
      setRejectionReason("")
      setApprovalHistory([])
    }
  }

  useEffect(() => {
    void loadApprovalSummary()
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
    setCurrentScreen(tab)
  }

  const navigateTo = (screen: Screen, dishId?: string) => {
    if (dishId) setSelectedDishId(dishId)
    setCurrentScreen(screen)
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "dashboard":
        return (
          <DashboardScreen
            onNavigate={navigateTo}
            poiApprovalStatus={poiApprovalStatus}
            rejectionReason={rejectionReason}
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
            onSubmitPoiRegistration={() => {
              void submitPoiRegistration(CURRENT_SHOP_ID)
                .then((summary) => {
                  setPoiApprovalStatus(summary.status)
                  setRejectionReason(summary.rejectionReason)
                  setApprovalHistory(summary.history)
                })
                .catch(() => {
                  // Keep current UI state if API submission fails.
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
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto relative pb-24">
        {renderScreen()}
      </div>
      <BottomNavigation activeTab={getActiveTab()} onTabChange={handleTabChange} />
    </div>
  )
}
