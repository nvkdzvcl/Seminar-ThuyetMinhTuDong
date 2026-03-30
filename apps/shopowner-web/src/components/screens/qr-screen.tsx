"use client"

import { useEffect, useMemo, useState } from "react"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Check,
  Download, 
  Printer, 
  Share2, 
  Volume2,
  Utensils
} from "lucide-react"

interface QRScreenProps {
  shopId: number
  shopName: string
}

const DEFAULT_CUSTOMER_WEB_URL = "http://localhost:5173"

function normalizeBaseUrl(rawBaseUrl?: string): string {
  if (!rawBaseUrl?.trim()) {
    return DEFAULT_CUSTOMER_WEB_URL
  }
  return rawBaseUrl.trim().replace(/\/+$/, "")
}

export function QRScreen({ shopId, shopName }: QRScreenProps) {
  const [qrImageDataUrl, setQrImageDataUrl] = useState("")
  const [isGeneratingQr, setIsGeneratingQr] = useState(false)
  const [qrError, setQrError] = useState("")
  const [actionMessage, setActionMessage] = useState("")
  const [didCopyLink, setDidCopyLink] = useState(false)

  const customerBaseUrl = useMemo(
    () => normalizeBaseUrl(import.meta.env.VITE_CUSTOMER_WEB_URL),
    []
  )

  const qrTargetUrl = useMemo(() => {
    if (!shopId) return ""
    return `${customerBaseUrl}/shop/${shopId}?autoplay=1`
  }, [customerBaseUrl, shopId])

  useEffect(() => {
    if (!shopId || !qrTargetUrl) {
      setQrImageDataUrl("")
      setQrError("Chưa có dữ liệu cửa hàng để tạo QR.")
      return
    }

    let cancelled = false
    setIsGeneratingQr(true)
    setQrError("")

    void QRCode.toDataURL(qrTargetUrl, {
      width: 512,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((dataUrl) => {
        if (cancelled) return
        setQrImageDataUrl(dataUrl)
      })
      .catch(() => {
        if (cancelled) return
        setQrImageDataUrl("")
        setQrError("Không thể tạo mã QR. Vui lòng thử lại.")
      })
      .finally(() => {
        if (!cancelled) {
          setIsGeneratingQr(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [qrTargetUrl, shopId])

  const handleDownload = () => {
    if (!qrImageDataUrl || !shopId) return

    const link = document.createElement("a")
    link.href = qrImageDataUrl
    link.download = `shop-${shopId}-qr.png`
    link.click()
    setActionMessage("Đã tải mã QR về máy.")
  }

  const handlePrint = () => {
    if (!qrImageDataUrl) return

    const printWindow = window.open("", "_blank", "noopener,noreferrer")
    if (!printWindow) {
      setActionMessage("Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup.")
      return
    }

    const safeShopName = shopName.replace(/[<>&'"]/g, "")

    printWindow.document.write(`
      <html>
        <head>
          <title>QR ${safeShopName}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 24px; }
            img { width: 320px; height: 320px; margin: 0 auto 16px; display: block; }
            h1 { font-size: 20px; margin: 0 0 8px; }
            p { margin: 0; color: #475569; font-size: 14px; word-break: break-all; }
          </style>
        </head>
        <body>
          <h1>${safeShopName}</h1>
          <img src="${qrImageDataUrl}" alt="Shop QR" />
          <p>${qrTargetUrl}</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    setActionMessage("Đã mở cửa sổ in poster QR.")
  }

  const handleShareOrCopy = async () => {
    if (!qrTargetUrl) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: `QR ${shopName}`,
          text: `Mở trang quán ${shopName}`,
          url: qrTargetUrl,
        })
        setActionMessage("Đã mở khung chia sẻ link QR.")
        return
      }

      await navigator.clipboard.writeText(qrTargetUrl)
      setDidCopyLink(true)
      setActionMessage("Đã copy link QR của quán.")
      window.setTimeout(() => setDidCopyLink(false), 1800)
    } catch {
      setActionMessage("Không thể chia sẻ/copy link. Vui lòng thử lại.")
    }
  }

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
            <div className="aspect-square relative overflow-hidden rounded-xl border border-slate-100">
              {isGeneratingQr ? (
                <div className="flex h-full w-full items-center justify-center bg-slate-50 text-sm text-slate-500">
                  Đang tạo QR...
                </div>
              ) : qrImageDataUrl ? (
                <img
                  src={qrImageDataUrl}
                  alt={`QR của ${shopName}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-red-50 px-3 text-center text-sm text-red-600">
                  {qrError || "Không tạo được mã QR"}
                </div>
              )}
            </div>
          </div>

          {/* Shop branding under QR */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              <Utensils className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">{shopName}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground break-all">{qrTargetUrl}</p>
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
          onClick={handleDownload}
          disabled={!qrImageDataUrl || isGeneratingQr}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs font-medium text-foreground">Tải xuống</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 border-border"
          onClick={handlePrint}
          disabled={!qrImageDataUrl || isGeneratingQr}
        >
          <div className="w-10 h-10 rounded-full bg-[oklch(0.7_0.16_55)]/10 flex items-center justify-center">
            <Printer className="w-5 h-5 text-[oklch(0.7_0.16_55)]" />
          </div>
          <span className="text-xs font-medium text-foreground">In poster</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 border-border"
          onClick={() => { void handleShareOrCopy() }}
          disabled={!qrTargetUrl || isGeneratingQr}
        >
          <div className="w-10 h-10 rounded-full bg-[oklch(0.85_0.15_85)]/15 flex items-center justify-center">
            {didCopyLink ? (
              <Check className="w-5 h-5 text-[oklch(0.7_0.12_85)]" />
            ) : (
              <Share2 className="w-5 h-5 text-[oklch(0.7_0.12_85)]" />
            )}
          </div>
          <span className="text-xs font-medium text-foreground">
            {didCopyLink ? "Đã copy" : "Chia sẻ"}
          </span>
        </Button>
      </div>

      {actionMessage ? (
        <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          {actionMessage}
        </div>
      ) : null}

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

    </div>
  )
}
