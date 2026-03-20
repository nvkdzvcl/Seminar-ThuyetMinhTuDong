"use client"

import { Home, UtensilsCrossed, QrCode, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavigationProps {
  activeTab: "dashboard" | "menu" | "qr" | "insights"
  onTabChange: (tab: "dashboard" | "menu" | "qr" | "insights") => void
}

const tabs = [
  { id: "dashboard" as const, label: "Trang chủ", icon: Home },
  { id: "menu" as const, label: "Thực đơn", icon: UtensilsCrossed },
  { id: "qr" as const, label: "Mã QR", icon: QrCode },
  { id: "insights" as const, label: "Thống kê", icon: BarChart3 },
]

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl min-w-[72px] transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "animate-in zoom-in-50 duration-200")} />
              <span className={cn(
                "text-xs font-medium",
                isActive ? "font-semibold" : ""
              )}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom bg-card" />
    </nav>
  )
}
