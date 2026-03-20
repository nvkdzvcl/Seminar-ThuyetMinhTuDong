"use client"

import { useState } from "react"
import { BottomNavigation } from "./bottom-navigation"
import { DashboardScreen } from "./screens/dashboard-screen"
import { MenuScreen } from "./screens/menu-screen"
import { QRScreen } from "./screens/qr-screen"
import { InsightsScreen } from "./screens/insights-screen"
import { ShopProfileScreen } from "./screens/shop-profile-screen"
import { DishEditorScreen } from "./screens/dish-editor-screen"
import { AudioManagementScreen } from "./screens/audio-management-screen"

type Screen = 
  | "dashboard" 
  | "menu" 
  | "qr" 
  | "insights" 
  | "shop-profile" 
  | "dish-editor"
  | "audio-management"

type Tab = "dashboard" | "menu" | "qr" | "insights"

interface AppShellProps {
  initialScreen?: Screen
}

export function AppShell({ initialScreen = "dashboard" }: AppShellProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>(initialScreen)
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null)

  const getActiveTab = (): Tab => {
    switch (currentScreen) {
      case "dashboard":
      case "shop-profile":
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
        return <DashboardScreen onNavigate={navigateTo} />
      case "menu":
        return <MenuScreen onNavigate={navigateTo} />
      case "qr":
        return <QRScreen onNavigate={navigateTo} />
      case "insights":
        return <InsightsScreen />
      case "shop-profile":
        return <ShopProfileScreen onBack={() => setCurrentScreen("dashboard")} />
      case "dish-editor":
        return (
          <DishEditorScreen 
            dishId={selectedDishId} 
            onBack={() => setCurrentScreen("menu")} 
          />
        )
      case "audio-management":
        return <AudioManagementScreen onBack={() => setCurrentScreen("qr")} />
      default:
        return <DashboardScreen onNavigate={navigateTo} />
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
