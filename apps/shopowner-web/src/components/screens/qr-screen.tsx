"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Download, 
  Printer, 
  Share2, 
  Volume2,
  Globe,
  Utensils
} from "lucide-react"

type Screen = "dashboard" | "menu" | "qr" | "insights" | "shop-profile" | "dish-editor" | "audio-management"

interface QRScreenProps {
  onNavigate: (screen: Screen) => void
}

export function QRScreen({ onNavigate }: QRScreenProps) {
  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Mã QR của quán</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Khách hàng quét để nghe giới thiệu
        </p>
      </div>

      {/* QR Code Display */}
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-6">
          {/* QR Code */}
          <div className="bg-white p-6 rounded-2xl shadow-inner mx-auto max-w-[280px]">
            <div className="aspect-square relative">
              {/* QR Code Pattern - Simplified SVG representation */}
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Corner squares */}
                <rect x="10" y="10" width="50" height="50" fill="currentColor" className="text-foreground" />
                <rect x="17" y="17" width="36" height="36" fill="white" />
                <rect x="24" y="24" width="22" height="22" fill="currentColor" className="text-foreground" />
                
                <rect x="140" y="10" width="50" height="50" fill="currentColor" className="text-foreground" />
                <rect x="147" y="17" width="36" height="36" fill="white" />
                <rect x="154" y="24" width="22" height="22" fill="currentColor" className="text-foreground" />
                
                <rect x="10" y="140" width="50" height="50" fill="currentColor" className="text-foreground" />
                <rect x="17" y="147" width="36" height="36" fill="white" />
                <rect x="24" y="154" width="22" height="22" fill="currentColor" className="text-foreground" />
                
                {/* Center pattern */}
                <rect x="70" y="70" width="60" height="60" rx="12" fill="currentColor" className="text-primary" />
                <rect x="80" y="80" width="40" height="40" rx="8" fill="white" />
                <circle cx="100" cy="100" r="12" fill="currentColor" className="text-primary" />
                
                {/* Random QR modules */}
                <rect x="70" y="20" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="90" y="20" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="110" y="20" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="70" y="40" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="100" y="40" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="120" y="40" width="10" height="10" fill="currentColor" className="text-foreground" />
                
                <rect x="20" y="70" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="40" y="70" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="20" y="90" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="40" y="100" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="20" y="120" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="50" y="120" width="10" height="10" fill="currentColor" className="text-foreground" />
                
                <rect x="140" y="70" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="160" y="80" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="170" y="100" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="150" y="110" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="170" y="120" width="10" height="10" fill="currentColor" className="text-foreground" />
                
                <rect x="70" y="140" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="90" y="150" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="110" y="140" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="120" y="160" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="100" y="170" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="140" y="150" width="10" height="10" fill="currentColor" className="text-foreground" />
                <rect x="160" y="170" width="10" height="10" fill="currentColor" className="text-foreground" />
              </svg>
            </div>
          </div>

          {/* Shop branding under QR */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              <Utensils className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Quán Ốc Bà Sáu</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan message */}
      <div className="text-center px-4">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Volume2 className="w-4 h-4" />
          Quét để nghe giới thiệu bằng nhiều ngôn ngữ
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 border-border"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs font-medium text-foreground">Tải xuống</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 border-border"
        >
          <div className="w-10 h-10 rounded-full bg-[oklch(0.7_0.16_55)]/10 flex items-center justify-center">
            <Printer className="w-5 h-5 text-[oklch(0.7_0.16_55)]" />
          </div>
          <span className="text-xs font-medium text-foreground">In poster</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 border-border"
        >
          <div className="w-10 h-10 rounded-full bg-[oklch(0.85_0.15_85)]/15 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-[oklch(0.7_0.12_85)]" />
          </div>
          <span className="text-xs font-medium text-foreground">Chia sẻ</span>
        </Button>
      </div>

      {/* Poster Preview */}
      <Card className="bg-[oklch(0.25_0.03_30)] border-0 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Mini poster mockup */}
            <div className="w-20 h-28 rounded-lg bg-white p-2 shrink-0 shadow-lg">
              <div className="w-full h-full border-2 border-dashed border-muted rounded flex flex-col items-center justify-center gap-1">
                <div className="w-8 h-8 bg-muted rounded" />
                <div className="w-6 h-1 bg-muted rounded" />
                <div className="w-10 h-1 bg-muted rounded" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[oklch(0.95_0.01_85)] mb-1">
                Poster để bàn
              </h3>
              <p className="text-sm text-[oklch(0.7_0.02_80)] mb-3">
                In poster với mã QR và thông tin quán để đặt trên bàn
              </p>
              <Button 
                size="sm" 
                className="bg-[oklch(0.7_0.16_55)] hover:bg-[oklch(0.65_0.16_55)] text-white"
              >
                Tải mẫu poster
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Management Link */}
      <Card 
        className="bg-card border-border cursor-pointer hover:bg-secondary/50 transition-colors"
        onClick={() => onNavigate("audio-management")}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Globe className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Quản lý thuyết minh</h3>
              <p className="text-sm text-muted-foreground">
                5 ngôn ngữ - 4 sẵn sàng, 1 đang chờ
              </p>
            </div>
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="w-2 h-2 rounded-full bg-[oklch(0.7_0.16_55)]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
