import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bot,
  Check,
  CircleAlert,
  FileText,
  Filter,
  MapPin,
  QrCode,
  Save,
  Search,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import type { POI } from '@/types'
import {
  fetchPoiDetailById,
  updatePoi,
  updatePoiStatus,
  type PoiApprovalHistoryItemDetail,
  type PoiMenuItemDetail,
  type PoiModerationLogDetail,
} from '@/services/poiService'

function moderationStatusColor(status: string) {
  if (status === 'Vi phạm') return 'text-red-600'
  if (status === 'Cần xem lại') return 'text-amber-600'
  return 'text-emerald-600'
}

function moderationStatusLabel(status?: string) {
  if (!status) return 'An toàn'
  if (status === 'AN_TOAN' || status === 'SAFE') return 'An toàn'
  if (status === 'CAN_XEM_LAI' || status === 'REVIEW_REQUIRED') return 'Cần xem lại'
  if (status === 'VI_PHAM' || status === 'VIOLATION') return 'Vi phạm'
  return status
}

function approvalStatusLabel(status: string) {
  if (status === 'pending') return 'Chờ duyệt'
  if (status === 'approved') return 'Đã duyệt'
  if (status === 'rejected') return 'Từ chối'
  return status
}

function toCurrency(value?: number) {
  if (value == null) return '--'
  return `${value.toLocaleString('vi-VN')}đ`
}

export function POIDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [poi, setPoi] = useState<POI | null>(null)
  const [menuItems, setMenuItems] = useState<PoiMenuItemDetail[]>([])
  const [approvalEvents, setApprovalEvents] = useState<PoiApprovalHistoryItemDetail[]>([])
  const [systemLogs, setSystemLogs] = useState<PoiModerationLogDetail[]>([])
  const [description, setDescription] = useState('')
  const [menuSearch, setMenuSearch] = useState('')
  const [reviewReason, setReviewReason] = useState('')
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const loadDetail = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const detail = await fetchPoiDetailById(id)
      setPoi(detail.poi)
      setDescription(detail.poi.description ?? '')
      setMenuItems(detail.menuItems)
      setApprovalEvents(detail.approvalHistory)
      setSystemLogs(detail.moderationLogs)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không tải được POI')
      setPoi(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  const handleSaveDraft = async () => {
    if (!id || !poi?.shopId) return

    setIsSavingDraft(true)
    try {
      const updatedPoi = await updatePoi(id, {
        shopId: Number(poi.shopId),
        description: description.trim(),
        region: poi.region,
        category: poi.category,
        qrCode: poi.qrCode,
        riskFlag: poi.riskFlag,
        riskScore: poi.riskScore,
      })
      setPoi(updatedPoi)
      setDescription(updatedPoi.description ?? '')
      toast.success('Đã lưu bản nháp POI')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lưu bản nháp thất bại')
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleApprove = async () => {
    if (!id) return

    setIsUpdatingStatus(true)
    try {
      const updatedPoi = await updatePoiStatus(id, { status: 'published' })
      setPoi(updatedPoi)
      setReviewReason('')
      toast.success(`Đã duyệt POI "${updatedPoi.name}"`)
      await loadDetail()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Duyệt POI thất bại')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleReject = async () => {
    if (!id) return
    if (!reviewReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối trước khi gửi')
      return
    }

    setIsUpdatingStatus(true)
    try {
      const updatedPoi = await updatePoiStatus(id, {
        status: 'flagged',
        reason: reviewReason,
      })
      setPoi(updatedPoi)
      setReviewReason('')
      toast.success(`Đã từ chối POI "${updatedPoi.name}"`)
      await loadDetail()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Từ chối POI thất bại')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const filteredMenu = useMemo(() => {
    if (!menuSearch.trim()) return menuItems
    const needle = menuSearch.toLowerCase()
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        (item.descriptionText ?? '').toLowerCase().includes(needle)
    )
  }, [menuItems, menuSearch])

  if (loading) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        Đang tải chi tiết POI...
      </div>
    )
  }

  if (!poi) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <EmptyState
          icon={MapPin}
          title="Không tìm thấy POI"
          description="POI này không tồn tại hoặc đã bị xóa"
          actionLabel="Quay lại danh sách"
          onAction={() => navigate('/poi')}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="text-xs text-muted-foreground">Admin / POI / Detail</div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">{poi.name}</h1>
          <StatusBadge status={poi.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/poi')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <Button variant="outline" size="sm" onClick={() => void handleSaveDraft()} disabled={isSavingDraft}>
            <Save className="mr-2 h-4 w-4" />
            {isSavingDraft ? 'Đang lưu...' : 'Lưu bản nháp'}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => void handleReject()}
            disabled={isUpdatingStatus}
          >
            <X className="mr-2 h-4 w-4" />
            {isUpdatingStatus ? 'Đang xử lý...' : 'Từ chối'}
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-500"
            onClick={() => void handleApprove()}
            disabled={isUpdatingStatus}
          >
            <Check className="mr-2 h-4 w-4" />
            {isUpdatingStatus ? 'Đang xử lý...' : 'Duyệt'}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_340px]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <CardContent className="space-y-4 p-4">
              <div className="relative h-56 overflow-hidden rounded-xl border">
                <img
                  src={poi.coverImage || '/images/backgrounds/bg-login.jpg'}
                  alt={poi.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/80">Hanoi, Vietnam</p>
                  <p className="text-2xl font-bold text-white">Quán ăn truyền thống</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2 space-y-3 rounded-lg border bg-card p-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chủ sở hữu</p>
                    <p className="mt-1 text-base font-semibold">{poi.ownerName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Địa chỉ</p>
                    <p className="mt-1 text-sm text-foreground">{poi.address || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tọa độ khu vực</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="secondary" className="font-mono">
                        {poi.lat?.toFixed(4) ?? '--'}, {poi.lng?.toFixed(4) ?? '--'}
                      </Badge>
                      <span className="text-muted-foreground">|</span>
                      <span>{poi.region || 'Không rõ khu vực'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border bg-card p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mã QR định danh</p>
                  <div className="flex items-center gap-2 rounded-md bg-muted/60 p-2">
                    <QrCode className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs font-mono">{poi.qrCode || 'Chưa tạo'}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-full justify-start text-xs">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Tạo mã QR (Soon)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide">
                  <FileText className="mr-2 inline h-4 w-4 text-blue-600" />
                  Mô tả quán (dùng cho Audio Generation)
                </h3>
                <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {description.length}/500 ký tự
                </span>
              </div>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value.slice(0, 500))}
                rows={5}
                className="bg-muted/40"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Ghi chú duyệt / từ chối
                </h3>
                <span className="text-xs text-muted-foreground">Bắt buộc khi từ chối</span>
              </div>
              <Textarea
                value={reviewReason}
                onChange={(event) => setReviewReason(event.target.value.slice(0, 500))}
                rows={4}
                placeholder="Nhập lý do nếu từ chối POI (ví dụ: thiếu mô tả rõ ràng, thông tin sai...)"
                className="bg-muted/40"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">Danh sách thực đơn</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={menuSearch}
                      onChange={(event) => setMenuSearch(event.target.value)}
                      placeholder="Tìm món..."
                      className="h-9 w-48 pl-8"
                    />
                  </div>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Tên món</th>
                      <th className="px-3 py-2 text-left">Giá</th>
                      <th className="px-3 py-2 text-center">Đánh giá</th>
                      <th className="px-3 py-2 text-left">Trạng thái kiểm duyệt</th>
                      <th className="px-3 py-2 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMenu.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-3">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.descriptionText || 'Chưa có mô tả'}</p>
                        </td>
                        <td className="px-3 py-3 font-semibold text-blue-600">{toCurrency(item.price)}</td>
                        <td className="px-3 py-3 text-center">
                          <div className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-amber-700">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                            <span className="text-xs font-semibold">{(item.rating ?? 0).toFixed(1)}</span>
                          </div>
                        </td>
                        <td
                          className={`px-3 py-3 font-medium ${moderationStatusColor(
                            moderationStatusLabel(item.moderationStatus)
                          )}`}
                        >
                          {moderationStatusLabel(item.moderationStatus)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Badge variant="outline">{item.status || 'ACTIVE'}</Badge>
                        </td>
                      </tr>
                    ))}
                    {filteredMenu.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">
                          Chưa có món ăn phù hợp bộ lọc.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Phân tích an toàn AI</h3>
              <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border-8 border-emerald-200">
                <div className="text-center">
                  <p className="text-3xl font-bold">{poi.riskScore ?? 15}</p>
                  <p className="text-xs text-muted-foreground">Rủi ro thấp</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">AI Labels</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">Ẩm thực</Badge>
                  <Badge variant="secondary">Hà Nội</Badge>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">An toàn</Badge>
                </div>
              </div>
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                Gợi ý chỉnh sửa: AI đề xuất thêm thông tin vị trí để mô tả dễ tạo audio tự nhiên hơn.
              </div>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm">
                  <Bot className="mr-1 h-4 w-4" />
                  Áp dụng gợi ý
                </Button>
                <Button size="sm">Quét AI ngay</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Lịch sử xét duyệt</h3>
              {approvalEvents.map((event) => (
                <div key={event.id} className="relative pl-4">
                  <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-blue-500" />
                  <p className="text-sm font-medium">{approvalStatusLabel(event.status)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.submittedAt).toLocaleDateString('vi-VN')} - {event.reviewer || 'Hệ thống'}
                  </p>
                  {event.reason ? <p className="text-xs text-muted-foreground">Lý do: {event.reason}</p> : null}
                </div>
              ))}
              {approvalEvents.length === 0 && (
                <p className="text-sm text-muted-foreground">Chưa có lịch sử xét duyệt.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Nhật ký hệ thống</h3>
                <Button variant="link" className="h-auto p-0 text-xs">
                  Xem tất cả
                </Button>
              </div>
              <Separator />
              {systemLogs.map((log) => (
                <div key={log.id} className="text-sm">
                  <p>
                    <span className="font-medium text-blue-600">{log.fieldName}</span> - {log.status || 'NEW'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : 'N/A'}
                  </p>
                </div>
              ))}
              {systemLogs.length === 0 && (
                <p className="text-sm text-muted-foreground">Chưa có nhật ký hệ thống.</p>
              )}
              <div className="rounded-md bg-emerald-600/10 p-2 text-xs text-emerald-700">
                <CircleAlert className="mr-1 inline h-3 w-3" />
                Dữ liệu đã đến mây có độ tin cậy cao (89%).
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
