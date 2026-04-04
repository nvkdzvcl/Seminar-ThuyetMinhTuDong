"use client"

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Camera,
  MapPin,
  Clock,
  Utensils,
  Globe,
  ImageIcon,
  Flame,
  Users,
  Save,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Send,
  History,
  LogOut,
  Phone,
  Mail,
  FileText,
} from "lucide-react"
import type { PoiApprovalStatus } from "@/components/app-shell"
import { parseFlexibleCoordinates } from "@/lib/coordinates"
import {
  previewPoiModeration,
  type PoiModerationPreviewResult,
} from "@/services/poi-moderation-service"

interface ShopProfileScreenProps {
  onBack: () => void
  poiApprovalStatus: PoiApprovalStatus
  rejectionReason: string
  onSubmitPoiRegistration: () => void
  onViewApprovalHistory: () => void
  onLogout: () => void
  initialShopName: string
  initialShopAddress: string
  initialShortDescription: string
  initialDetailedDescription: string
  initialShopLat?: number | null
  initialShopLng?: number | null
  ownerPhoneNumber?: string | null
  ownerEmail?: string | null
  isSaving: boolean
  onSaveShop: (payload: {
    name: string
    address: string
    shortDescription: string
    detailedDescription: string
    description: string
    lat?: number
    lng?: number
  }) => Promise<void>
}

const touristTags = [
  { id: "english", label: "Hỗ trợ tiếng Anh", icon: Globe },
  { id: "photo-menu", label: "Menu có hình ảnh", icon: ImageIcon },
  { id: "non-spicy", label: "Có món không cay", icon: Flame },
  { id: "family", label: "Chỗ ngồi gia đình", icon: Users },
]

const SHORT_DESCRIPTION_LIMIT = 140
const DETAILED_DESCRIPTION_LIMIT = 500
const MODERATION_MIN_DESCRIPTION_LENGTH = 20
const MODERATION_IDLE_MS = 1800
const SAVE_BUTTON_DEFAULT_LABEL = "Lưu thay đổi"
const SAVE_BUTTON_BLOCKED_LABEL = "Cần chỉnh sửa nội dung"

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function ShopProfileScreen({
  onBack,
  poiApprovalStatus,
  rejectionReason,
  onSubmitPoiRegistration,
  onViewApprovalHistory,
  onLogout,
  initialShopName,
  initialShopAddress,
  initialShortDescription,
  initialDetailedDescription,
  initialShopLat,
  initialShopLng,
  ownerPhoneNumber,
  ownerEmail,
  isSaving,
  onSaveShop,
}: ShopProfileScreenProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(["english", "photo-menu"])
  const [isOpen, setIsOpen] = useState(true)
  const [shopName, setShopName] = useState("Quán Ốc Bà Sáu")
  const [cuisine, setCuisine] = useState("Ốc & Hải sản")
  const [address, setAddress] = useState("45 Vĩnh Khánh, Phường 10, Quận 4")
  const [shortDescription, setShortDescription] = useState(
    "Quán ốc gia truyền 30 năm, chuyên hải sản tươi và món nướng đậm vị miền Nam.",
  )
  const [detailedDescription, setDetailedDescription] = useState(
    "Quán ốc gia truyền 30 năm tại phố ẩm thực Vĩnh Khánh. Chuyên các món ốc tươi sống, hải sản nướng và lẩu. Không gian phù hợp nhóm bạn và gia đình, phục vụ nhanh vào khung giờ cao điểm tối.",
  )
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [coordinateRaw, setCoordinateRaw] = useState("")
  const [coordinateError, setCoordinateError] = useState<string | null>(null)
  const [isModerationChecking, setIsModerationChecking] = useState(false)
  const [moderationPreview, setModerationPreview] = useState<PoiModerationPreviewResult | null>(null)
  const [moderationError, setModerationError] = useState<string | null>(null)
  const [hasEditedDetailedDescription, setHasEditedDetailedDescription] = useState(false)
  const [autoModerationPaused, setAutoModerationPaused] = useState(false)
  const contactPhone = ownerPhoneNumber?.trim() || "Chưa cập nhật số điện thoại"
  const contactEmail = ownerEmail?.trim() || "Chưa cập nhật email"
  const [isDesktopViewport, setIsDesktopViewport] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }
    return window.matchMedia("(min-width: 768px)").matches
  })
  const moderationRequestRef = useRef(0)
  const lastAutoModerationFingerprintRef = useRef("")
  const deferredDetailedDescription = useDeferredValue(detailedDescription)

  const isModerationBlocked = moderationPreview?.decision === "BLOCK"

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  const getPoiStatusInfo = () => {
    if (poiApprovalStatus === "approved") {
      return {
        label: "Đã duyệt",
        description: "POI đã được duyệt, quán có thể hiển thị public.",
        icon: ShieldCheck,
        badgeClass: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
      }
    }
    if (poiApprovalStatus === "pending") {
      return {
        label: "Chờ duyệt",
        description: "Yêu cầu đăng ký POI đang được admin kiểm tra.",
        icon: ShieldAlert,
        badgeClass: "bg-amber-500/15 text-amber-600 border-amber-500/30",
      }
    }
    if (poiApprovalStatus === "rejected") {
      return {
        label: "Bị từ chối",
        description: "Vui lòng chỉnh sửa thông tin và gửi lại yêu cầu duyệt.",
        icon: ShieldX,
        badgeClass: "bg-destructive/10 text-destructive border-destructive/30",
      }
    }
    return {
      label: "Chưa đăng ký",
      description: "Quán chưa đăng ký POI. Nội dung chỉ ở trạng thái nháp.",
      icon: ShieldAlert,
      badgeClass: "bg-muted text-muted-foreground border-border",
    }
  }

  const poiStatusInfo = getPoiStatusInfo()
  const StatusIcon = poiStatusInfo.icon

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    const mediaQuery = window.matchMedia("(min-width: 768px)")
    const handleViewportChange = (event: MediaQueryListEvent) => {
      setIsDesktopViewport(event.matches)
    }

    setIsDesktopViewport(mediaQuery.matches)
    mediaQuery.addEventListener("change", handleViewportChange)
    return () => {
      mediaQuery.removeEventListener("change", handleViewportChange)
    }
  }, [])

  useEffect(() => {
    setShopName(initialShopName || "Quán của tôi")
    setAddress(initialShopAddress || "")
    const resolvedDetailedDescription = initialDetailedDescription || ""
    const resolvedShortDescription = initialShortDescription || resolvedDetailedDescription.slice(0, SHORT_DESCRIPTION_LIMIT)
    setDetailedDescription(resolvedDetailedDescription)
    setShortDescription(resolvedShortDescription)
    setLatitude(typeof initialShopLat === "number" ? String(initialShopLat) : "")
    setLongitude(typeof initialShopLng === "number" ? String(initialShopLng) : "")
    setCoordinateRaw("")
    setCoordinateError(null)
    setHasEditedDetailedDescription(false)
    setAutoModerationPaused(false)
    lastAutoModerationFingerprintRef.current = ""
  }, [initialShopName, initialShopAddress, initialShortDescription, initialDetailedDescription, initialShopLat, initialShopLng])

  const highlightedDescriptionPreview = useMemo(() => {
    const sourceText = deferredDetailedDescription || ""
    const terms = (moderationPreview?.matchedTerms ?? [])
      .map((item) => item.trim())
      .filter((item) => item.length > 1)

    if (!sourceText || terms.length === 0) {
      return sourceText
    }

    const uniqueTerms = Array.from(new Set(terms)).sort((a, b) => b.length - a.length)
    const regex = new RegExp(`(${uniqueTerms.map(escapeRegExp).join("|")})`, "gi")
    const parts = sourceText.split(regex)

    return parts.map((part, index) => {
      const isMatch = uniqueTerms.some((term) => part.toLowerCase() === term.toLowerCase())
      if (!isMatch) {
        return <span key={`txt-${index}`}>{part}</span>
      }
      return (
        <mark key={`mark-${index}`} className="rounded bg-red-200 px-0.5 text-red-900">
          {part}
        </mark>
      )
    })
  }, [deferredDetailedDescription, moderationPreview?.matchedTerms])

  const runModerationPreview = async (
    overrideDescription?: string,
    options?: { showLoading?: boolean; isAuto?: boolean; fingerprint?: string; pauseAutoAfterResult?: boolean },
  ): Promise<PoiModerationPreviewResult | null> => {
    const nameToCheck = shopName.trim()
    const categoryToCheck = cuisine.trim()
    const addressToCheck = address.trim()
    const descriptionToCheck = (overrideDescription ?? detailedDescription).trim()
    if (!descriptionToCheck) {
      setModerationPreview(null)
      setModerationError(null)
      if (options?.isAuto) {
        lastAutoModerationFingerprintRef.current = ""
      }
      return null
    }
    if (descriptionToCheck.length < MODERATION_MIN_DESCRIPTION_LENGTH) {
      setModerationPreview(null)
      setModerationError(null)
      if (options?.isAuto) {
        lastAutoModerationFingerprintRef.current = ""
      }
      return null
    }

    const fingerprint =
      options?.fingerprint ??
      `${nameToCheck}||${categoryToCheck}||${addressToCheck}||${descriptionToCheck}`
    if (options?.isAuto) {
      if (fingerprint === lastAutoModerationFingerprintRef.current) {
        return moderationPreview
      }
      lastAutoModerationFingerprintRef.current = fingerprint
    }

    const requestId = ++moderationRequestRef.current
    const shouldShowLoading = options?.showLoading ?? true

    if (shouldShowLoading) {
      setIsModerationChecking(true)
    }
    setModerationError(null)
    try {
      const preview = await previewPoiModeration({
        name: nameToCheck,
        category: categoryToCheck,
        address: addressToCheck,
        description: descriptionToCheck,
      })
      if (requestId !== moderationRequestRef.current) {
        return null
      }
      setModerationPreview(preview)
      if (options?.isAuto && options.pauseAutoAfterResult) {
        setAutoModerationPaused(true)
      }
      return preview
    } catch {
      if (requestId !== moderationRequestRef.current) {
        return null
      }
      setModerationError("Không kiểm tra được nội dung ngay lúc này. Bạn vẫn có thể lưu nháp.")
      return null
    } finally {
      if (shouldShowLoading && requestId === moderationRequestRef.current) {
        setIsModerationChecking(false)
      }
    }
  }

  useEffect(() => {
    if (!hasEditedDetailedDescription || autoModerationPaused) {
      setIsModerationChecking(false)
      return
    }

    const nameToCheck = shopName.trim()
    const categoryToCheck = cuisine.trim()
    const addressToCheck = address.trim()
    const descriptionToCheck = detailedDescription.trim()
    if (!descriptionToCheck || descriptionToCheck.length < MODERATION_MIN_DESCRIPTION_LENGTH) {
      setModerationPreview(null)
      setModerationError(null)
      setIsModerationChecking(false)
      lastAutoModerationFingerprintRef.current = ""
      return
    }
    const fingerprint = `${nameToCheck}||${categoryToCheck}||${addressToCheck}||${descriptionToCheck}`

    const timer = window.setTimeout(() => {
      void runModerationPreview(descriptionToCheck, {
        showLoading: false,
        isAuto: true,
        fingerprint,
        pauseAutoAfterResult: true,
      })
    }, MODERATION_IDLE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [detailedDescription, shopName, cuisine, address, hasEditedDetailedDescription, autoModerationPaused])

  const handleDetailedDescriptionChange = (value: string) => {
    setDetailedDescription(value)
    setHasEditedDetailedDescription(true)
    if (autoModerationPaused) {
      setModerationPreview(null)
      setModerationError(null)
    }
  }

  const handleSaveShopProfile = async () => {
    const parseNumberInput = (value: string): number | null => {
      if (!value.trim()) return null
      const parsed = Number(value)
      return Number.isNaN(parsed) ? null : parsed
    }

    let lat: number | undefined
    let lng: number | undefined

    if (coordinateRaw.trim()) {
      const parsedCoordinates = parseFlexibleCoordinates(coordinateRaw)
      if (!parsedCoordinates) {
        setCoordinateError(
          "Không đọc được tọa độ. Hãy nhập dạng DMS (N/E/W/S) hoặc dạng số thập phân `lat, lng`.",
        )
        return
      }
      lat = parsedCoordinates.lat
      lng = parsedCoordinates.lng
      setLatitude(parsedCoordinates.lat.toFixed(8))
      setLongitude(parsedCoordinates.lng.toFixed(8))
    } else {
      const latValue = parseNumberInput(latitude)
      const lngValue = parseNumberInput(longitude)

      if ((latValue === null && lngValue !== null) || (latValue !== null && lngValue === null)) {
        setCoordinateError("Vui lòng nhập đủ cả vĩ độ và kinh độ.")
        return
      }

      if (latValue !== null && (latValue < -90 || latValue > 90)) {
        setCoordinateError("Vĩ độ không hợp lệ. Giá trị hợp lệ từ -90 đến 90.")
        return
      }

      if (lngValue !== null && (lngValue < -180 || lngValue > 180)) {
        setCoordinateError("Kinh độ không hợp lệ. Giá trị hợp lệ từ -180 đến 180.")
        return
      }

      if (latValue !== null && lngValue !== null) {
        lat = latValue
        lng = lngValue
      }
    }

    const preview = await runModerationPreview(detailedDescription)
    if (preview?.decision === "BLOCK") {
      setCoordinateError(null)
      setModerationError(preview.message || "Mô tả có dấu hiệu vi phạm rõ ràng, vui lòng chỉnh sửa.")
      return
    }

    setCoordinateError(null)
    await onSaveShop({
      name: shopName.trim(),
      address: address.trim(),
      shortDescription: shortDescription.trim(),
      detailedDescription: detailedDescription.trim(),
      description: detailedDescription.trim(),
      lat,
      lng,
    })
  }

  const handleSubmitPoiRegistration = async () => {
    const preview = await runModerationPreview(detailedDescription)
    if (preview?.decision === "BLOCK") {
      setModerationError(preview.message || "Mô tả có dấu hiệu vi phạm rõ ràng, vui lòng chỉnh sửa.")
      return
    }
    onSubmitPoiRegistration()
  }

  const moderationToneClass =
    moderationPreview?.decision === "BLOCK"
      ? "border-red-200 bg-red-50 text-red-700"
      : moderationPreview?.decision === "WARN"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700"
  const saveButtonLabel = isModerationBlocked ? SAVE_BUTTON_BLOCKED_LABEL : SAVE_BUTTON_DEFAULT_LABEL

  return (
    <div className="min-h-screen bg-background">
      {!isDesktopViewport ? (
      <div>
        <div className="relative h-52 bg-muted">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-black/35" />

          <div className="absolute left-0 right-0 top-0 p-4 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/35 hover:bg-black/55 text-white"
              onClick={onBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="bg-black/35 hover:bg-black/55 text-white gap-2">
                <Camera className="w-4 h-4" />
                Đổi ảnh bìa
              </Button>
              <Button variant="ghost" size="sm" className="bg-black/35 hover:bg-black/55 text-white" onClick={onLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="absolute -bottom-12 left-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center shadow-lg border-4 border-background">
                <Utensils className="w-10 h-10 text-primary-foreground" />
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center shadow-md">
                <Camera className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-16 px-4 pb-24 space-y-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="shop-name-mobile">Tên quán</Label>
                <Input
                  id="shop-name-mobile"
                  value={shopName}
                  onChange={(event) => setShopName(event.target.value)}
                  className="h-11 text-base font-semibold"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border px-3 py-2">
                <div>
                  <p className="font-medium text-foreground">Trạng thái quán</p>
                  <p className="text-sm text-muted-foreground">{isOpen ? "Quán đang mở cửa" : "Quán đã đóng cửa"}</p>
                </div>
                <Switch checked={isOpen} onCheckedChange={setIsOpen} className="data-[state=checked]:bg-emerald-500" />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Địa chỉ
                </Label>
                <Input value={address} onChange={(event) => setAddress(event.target.value)} className="h-11" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coordinate-raw-mobile" className="text-foreground font-medium">
                  Tọa độ dán nhanh
                </Label>
                <Input
                  id="coordinate-raw-mobile"
                  value={coordinateRaw}
                  onChange={(event) => setCoordinateRaw(event.target.value)}
                  placeholder={`Ví dụ: 10°46'42.0"N 106°39'47.8"E hoặc 10.7614867, 106.6809530`}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Hệ thống tự hiểu cả dạng điện thoại (N/E/W/S) và dạng số thập phân.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="latitude-mobile">Vĩ độ</Label>
                  <Input
                    id="latitude-mobile"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(event) => setLatitude(event.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude-mobile">Kinh độ</Label>
                  <Input
                    id="longitude-mobile"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(event) => setLongitude(event.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
              {coordinateError ? <p className="text-sm text-destructive">{coordinateError}</p> : null}

              <div className="space-y-2">
                <Label className="text-foreground font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Giờ mở cửa
                </Label>
                <div className="flex gap-3">
                  <Input defaultValue="16:00" type="time" className="h-11 flex-1" />
                  <span className="flex items-center text-muted-foreground">đến</span>
                  <Input defaultValue="23:00" type="time" className="h-11 flex-1" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-muted-foreground" />
                  Loại hình ẩm thực
                </Label>
                <Input value={cuisine} onChange={(event) => setCuisine(event.target.value)} className="h-11" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Mô tả cửa hàng</h3>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="short-description-mobile">Mô tả ngắn (hiển thị cho khách)</Label>
                  <span className="text-xs text-muted-foreground">
                    {shortDescription.length}/{SHORT_DESCRIPTION_LIMIT}
                  </span>
                </div>
                <Textarea
                  id="short-description-mobile"
                  value={shortDescription}
                  maxLength={SHORT_DESCRIPTION_LIMIT}
                  onChange={(event) => setShortDescription(event.target.value)}
                  className="min-h-[90px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="detailed-description-mobile">Mô tả chi tiết (dùng cho AI audio)</Label>
                  <span className="text-xs text-muted-foreground">
                    {detailedDescription.length}/{DETAILED_DESCRIPTION_LIMIT}
                  </span>
                </div>
                <Textarea
                  id="detailed-description-mobile"
                  value={detailedDescription}
                  maxLength={DETAILED_DESCRIPTION_LIMIT}
                  onChange={(event) => handleDetailedDescriptionChange(event.target.value)}
                  className="min-h-[140px] resize-none"
                />
              </div>

              {isModerationChecking ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                  AI đang kiểm tra nội dung mô tả...
                </div>
              ) : null}
              {moderationPreview ? (
                <div className={`rounded-lg border p-3 text-sm ${moderationToneClass}`}>
                  <p className="font-medium">{moderationPreview.message}</p>
                  <p className="mt-1 text-xs">
                    Điểm rủi ro: {moderationPreview.riskScore}/100 ({moderationPreview.decision})
                  </p>
                  {(moderationPreview.matchedTerms?.length ?? 0) > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {moderationPreview.matchedTerms.map((term) => (
                        <Badge key={`m-mobile-${term}`} variant="outline" className="border-current text-current">
                          {term}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {moderationError ? (
                <p className="text-sm text-destructive">{moderationError}</p>
              ) : null}
              {autoModerationPaused && hasEditedDetailedDescription ? (
                <p className="text-xs text-muted-foreground">
                  AI đã tạm dừng tự kiểm tra để ưu tiên nhập liệu. Hệ thống sẽ kiểm tra lại khi bạn bấm Lưu hoặc Gửi duyệt.
                </p>
              ) : null}
              {(moderationPreview?.matchedTerms?.length ?? 0) > 0 ? (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-6 text-foreground">
                  {highlightedDescriptionPreview}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon className="w-4 h-4" />
                  <p className="font-medium text-foreground">Trạng thái POI</p>
                </div>
                <Badge className={poiStatusInfo.badgeClass}>{poiStatusInfo.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{poiStatusInfo.description}</p>
              {poiApprovalStatus === "rejected" && rejectionReason ? (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Lý do từ chối</p>
                  <p className="text-sm">{rejectionReason}</p>
                </div>
              ) : null}
              <div className="flex gap-2">
                {(poiApprovalStatus === "unregistered" || poiApprovalStatus === "rejected") && (
                  <Button className="gap-2" onClick={() => { void handleSubmitPoiRegistration() }} disabled={isModerationChecking || isModerationBlocked}>
                    <Send className="w-4 h-4" />
                    {poiApprovalStatus === "rejected" ? "Gửi lại duyệt" : "Gửi đăng ký POI"}
                  </Button>
                )}
                <Button variant="outline" className="gap-2" onClick={onViewApprovalHistory}>
                  <History className="w-4 h-4" />
                  Lịch sử duyệt
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-foreground">Tài khoản chủ quán</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{contactPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{contactEmail}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full">
                  Đổi mật khẩu
                </Button>
                <Button variant="destructive" className="w-full gap-2" onClick={onLogout}>
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Label className="text-foreground font-medium">Thẻ thân thiện với du khách</Label>
            <div className="grid grid-cols-2 gap-2">
              {touristTags.map((tag) => {
                const Icon = tag.icon
                const isSelected = selectedTags.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm ${isSelected ? "text-primary font-medium" : "text-foreground"}`}>
                      {tag.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
            <div className="max-w-md mx-auto">
              <Button className="w-full h-12 text-base font-semibold gap-2" onClick={() => { void handleSaveShopProfile() }} disabled={isSaving || isModerationChecking || isModerationBlocked}>
                <Save className="w-5 h-5" />
                {isSaving ? "Đang lưu..." : saveButtonLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>) : null}

      {isDesktopViewport ? (<div className="hidden md:block">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <Button variant="outline" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Shop Owner / Hồ sơ quán</p>
                <h1 className="text-2xl font-bold leading-tight text-foreground">Quản lý thông tin cửa hàng</h1>
              </div>
              <Badge className={`shrink-0 ${poiStatusInfo.badgeClass}`}>{poiStatusInfo.label}</Badge>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
              <Button variant="outline" className="gap-2 whitespace-nowrap" onClick={onViewApprovalHistory}>
                <History className="h-4 w-4" />
                Lịch sử duyệt
              </Button>
              {(poiApprovalStatus === "unregistered" || poiApprovalStatus === "rejected") && (
                <Button className="gap-2 whitespace-nowrap" onClick={() => { void handleSubmitPoiRegistration() }} disabled={isModerationChecking || isModerationBlocked}>
                  <Send className="h-4 w-4" />
                  {poiApprovalStatus === "rejected" ? "Gửi lại duyệt" : "Gửi đăng ký POI"}
                </Button>
              )}
              <Button
                variant="secondary"
                className="gap-2 whitespace-nowrap"
                onClick={() => {
                  void handleSaveShopProfile()
                }}
                disabled={isSaving || isModerationChecking || isModerationBlocked}
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Đang lưu..." : saveButtonLabel}
              </Button>
              <Button variant="destructive" className="gap-2 whitespace-nowrap" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_360px]">
            <div className="space-y-6">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative h-56">
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80')",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                    <div className="absolute left-6 top-6 flex items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-background/95 shadow-md">
                        <Utensils className="h-7 w-7 text-primary" />
                      </div>
                      <Button variant="secondary" size="sm" className="gap-2">
                        <Camera className="h-4 w-4" />
                        Đổi ảnh bìa
                      </Button>
                    </div>
                    <div className="absolute bottom-6 left-6">
                      <p className="text-xs uppercase tracking-widest text-white/80">Vinh Khanh Street</p>
                      <h2 className="text-3xl font-bold text-white">{shopName}</h2>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-5 p-5">
                  <h3 className="text-base font-semibold">Thông tin cơ bản</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="shop-name-desktop">Tên quán</Label>
                      <Input
                        id="shop-name-desktop"
                        value={shopName}
                        onChange={(event) => setShopName(event.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cuisine-desktop">Loại hình ẩm thực</Label>
                      <Input
                        id="cuisine-desktop"
                        value={cuisine}
                        onChange={(event) => setCuisine(event.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Địa chỉ
                    </Label>
                    <Input value={address} onChange={(event) => setAddress(event.target.value)} className="h-11" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coordinate-raw-desktop">Tọa độ dán nhanh</Label>
                    <Input
                      id="coordinate-raw-desktop"
                      value={coordinateRaw}
                      onChange={(event) => setCoordinateRaw(event.target.value)}
                      placeholder={`Ví dụ: 10°46'42.0"N 106°39'47.8"E hoặc 10.7614867, 106.6809530`}
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      Hỗ trợ cả dạng điện thoại (N/E/W/S) và dạng số thập phân.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="latitude-desktop">Vĩ độ</Label>
                      <Input
                        id="latitude-desktop"
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(event) => setLatitude(event.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude-desktop">Kinh độ</Label>
                      <Input
                        id="longitude-desktop"
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(event) => setLongitude(event.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>
                  {coordinateError ? <p className="text-sm text-destructive">{coordinateError}</p> : null}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Giờ mở cửa
                      </Label>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <Input defaultValue="16:00" type="time" className="h-11" />
                        <span className="text-sm text-muted-foreground">đến</span>
                        <Input defaultValue="23:00" type="time" className="h-11" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">Trạng thái quán</p>
                        <p className="text-sm text-muted-foreground">{isOpen ? "Đang mở cửa" : "Đóng cửa"}</p>
                      </div>
                      <Switch
                        checked={isOpen}
                        onCheckedChange={setIsOpen}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">Mô tả cửa hàng</h3>
                    <span className="text-xs text-muted-foreground">dùng cho hiển thị và tạo audio</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="short-description-desktop">Mô tả ngắn</Label>
                      <span className="text-xs text-muted-foreground">
                        {shortDescription.length}/{SHORT_DESCRIPTION_LIMIT}
                      </span>
                    </div>
                    <Textarea
                      id="short-description-desktop"
                      value={shortDescription}
                      maxLength={SHORT_DESCRIPTION_LIMIT}
                      onChange={(event) => setShortDescription(event.target.value)}
                      className="min-h-[88px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description-desktop">Mô tả chi tiết</Label>
                      <span className="text-xs text-muted-foreground">
                        {detailedDescription.length}/{DETAILED_DESCRIPTION_LIMIT}
                      </span>
                    </div>
                    <Textarea
                      id="description-desktop"
                      value={detailedDescription}
                      maxLength={DETAILED_DESCRIPTION_LIMIT}
                      onChange={(event) => handleDetailedDescriptionChange(event.target.value)}
                      className="min-h-[150px] resize-none"
                    />
                  </div>

                  {isModerationChecking ? (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                      AI đang kiểm tra nội dung mô tả...
                    </div>
                  ) : null}
                  {moderationPreview ? (
                    <div className={`rounded-lg border p-3 text-sm ${moderationToneClass}`}>
                      <p className="font-medium">{moderationPreview.message}</p>
                      <p className="mt-1 text-xs">
                        Điểm rủi ro: {moderationPreview.riskScore}/100 ({moderationPreview.decision})
                      </p>
                      {(moderationPreview.matchedTerms?.length ?? 0) > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {moderationPreview.matchedTerms.map((term) => (
                            <Badge key={`m-desktop-${term}`} variant="outline" className="border-current text-current">
                              {term}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      {moderationPreview.suggestedRewrite ? (
                        <button
                          type="button"
                          className="mt-2 text-xs underline"
                          onClick={() => handleDetailedDescriptionChange(moderationPreview.suggestedRewrite || "")}
                        >
                          Áp dụng gợi ý viết lại
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {moderationError ? (
                    <p className="text-sm text-destructive">{moderationError}</p>
                  ) : null}
                  {autoModerationPaused && hasEditedDetailedDescription ? (
                    <p className="text-xs text-muted-foreground">
                      AI đã tạm dừng tự kiểm tra để ưu tiên nhập liệu. Hệ thống sẽ kiểm tra lại khi bạn bấm Lưu hoặc Gửi duyệt.
                    </p>
                  ) : null}
                  {(moderationPreview?.matchedTerms?.length ?? 0) > 0 ? (
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-6 text-foreground">
                      {highlightedDescriptionPreview}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-3 p-5">
                  <h3 className="text-base font-semibold">Thẻ thân thiện với du khách</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {touristTags.map((tag) => {
                      const Icon = tag.icon
                      const isSelected = selectedTags.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-muted-foreground/30"
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={`${isSelected ? "font-medium text-primary" : "text-foreground"}`}>
                            {tag.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Trạng thái duyệt POI</h3>
                  </div>
                  <Badge className={poiStatusInfo.badgeClass}>{poiStatusInfo.label}</Badge>
                  <p className="text-sm text-muted-foreground">{poiStatusInfo.description}</p>

                  {poiApprovalStatus === "rejected" && rejectionReason ? (
                    <div className="rounded-lg bg-destructive/5 p-3">
                      <p className="mb-1 text-xs font-medium text-destructive">Lý do từ chối</p>
                      <p className="text-sm text-foreground">{rejectionReason}</p>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    {(poiApprovalStatus === "unregistered" || poiApprovalStatus === "rejected") && (
                      <Button className="w-full gap-2" onClick={() => { void handleSubmitPoiRegistration() }} disabled={isModerationChecking || isModerationBlocked}>
                        <Send className="h-4 w-4" />
                        {poiApprovalStatus === "rejected" ? "Gửi lại yêu cầu" : "Gửi đăng ký POI"}
                      </Button>
                    )}
                    <Button variant="outline" className="w-full gap-2" onClick={onViewApprovalHistory}>
                      <History className="h-4 w-4" />
                      Xem lịch sử duyệt
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-3 p-5">
                  <h3 className="text-base font-semibold">Tài khoản chủ quán</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{contactPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{contactEmail}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Đổi mật khẩu
                  </Button>
                  <Button variant="destructive" className="w-full gap-2" onClick={onLogout}>
                    <LogOut className="h-4 w-4" />
                    Đăng xuất tài khoản
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-3 p-5">
                  <h3 className="text-base font-semibold">Checklist trước khi gửi duyệt</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="rounded-md bg-muted p-2">- Tên quán, địa chỉ và giờ mở cửa đã chính xác</li>
                    <li className="rounded-md bg-muted p-2">- Mô tả ngắn và mô tả chi tiết đầy đủ, không phản cảm</li>
                    <li className="rounded-md bg-muted p-2">- Ảnh bìa rõ ràng, đúng thương hiệu</li>
                    <li className="rounded-md bg-muted p-2">- Gắn các thẻ du lịch phù hợp</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>) : null}
    </div>
  )
}
