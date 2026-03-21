'use client'

import { useState } from 'react'
import { Camera, Keyboard, QrCode, History, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { mockScanHistory } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface ScanPageProps {
  onShopScanned?: (shopId: string) => void
}

export function ScanPage({ onShopScanned }: ScanPageProps) {
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [isCameraActive, setIsCameraActive] = useState(false)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const handleOpenCamera = () => {
    setIsCameraActive(true)
    // Simulate camera activation
    setTimeout(() => setIsCameraActive(false), 3000)
  }

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onShopScanned?.(manualCode)
      setManualCode('')
      setShowManualInput(false)
    }
  }

  return (
    <div className="pb-4">
      {/* Scanner Area */}
      <div className="mx-4 mt-4">
        <div className={cn(
          'relative aspect-square max-h-[320px] bg-muted rounded-2xl overflow-hidden',
          isCameraActive && 'bg-foreground/90'
        )}>
          {/* Scanner Frame */}
          <div className="absolute inset-8 border-2 border-dashed border-primary/50 rounded-xl">
            {/* Corner markers */}
            <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
            
            {/* Scanning line animation */}
            {isCameraActive && (
              <div className="absolute inset-x-2 h-0.5 bg-primary/80 animate-[scan_2s_ease-in-out_infinite]" />
            )}
          </div>
          
          {/* Center Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isCameraActive ? (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
                <p className="text-sm text-primary-foreground mt-4 font-medium">Đang quét...</p>
              </div>
            ) : (
              <div className="text-center">
                <QrCode className="h-16 w-16 text-muted-foreground/50 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Hướng camera vào mã QR</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mx-4 mt-4 space-y-3">
        <Button 
          className="w-full h-12"
          onClick={handleOpenCamera}
          disabled={isCameraActive}
        >
          <Camera className="h-5 w-5 mr-2" />
          {isCameraActive ? 'Đang quét...' : 'Mở camera'}
        </Button>
        
        <Button 
          variant="secondary" 
          className="w-full h-12"
          onClick={() => setShowManualInput(!showManualInput)}
        >
          <Keyboard className="h-5 w-5 mr-2" />
          Nhập mã quán
        </Button>
        
        {showManualInput && (
          <div className="flex gap-2 animate-in slide-in-from-top-2">
            <Input
              placeholder="Nhập mã quán (VD: QUAN001)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 h-10"
            />
            <Button onClick={handleManualSubmit} className="h-10 px-4">
              Tìm
            </Button>
          </div>
        )}
      </div>

      {/* Scan History */}
      <section className="mt-6">
        <div className="flex items-center gap-2 px-4 mb-3">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Lịch sử quét gần đây</h3>
        </div>
        
        {mockScanHistory.length === 0 ? (
          <div className="mx-4 py-8 text-center">
            <QrCode className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Chưa có lịch sử quét</p>
          </div>
        ) : (
          <div className="mx-4 space-y-2">
            {mockScanHistory.map((scan) => (
              <button
                key={scan.id}
                className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors text-left"
                onClick={() => onShopScanned?.(scan.shopId)}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <QrCode className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{scan.shopName}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(scan.scannedAt)}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Scanning line animation keyframes */}
      <style jsx>{`
        @keyframes scan {
          0%, 100% { top: 8px; }
          50% { top: calc(100% - 8px); }
        }
      `}</style>
    </div>
  )
}
