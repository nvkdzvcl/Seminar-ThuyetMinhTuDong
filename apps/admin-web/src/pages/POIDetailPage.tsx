import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Store, AlertTriangle, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import type { POIStatus, POI } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { fetchPoiById, updatePoiStatus } from '@/services/poiService'

const statusTransitions: Record<POIStatus, POIStatus[]> = {
  draft: ['published'],
  published: ['flagged'],
  flagged: ['published', 'hidden'],
  hidden: ['draft', 'published'],
}

const statusTransitionLabels: Record<string, string> = {
  'draft->published': 'Công khai',
  'published->flagged': 'Gắn cờ',
  'flagged->published': 'Bỏ cờ & Công khai',
  'flagged->hidden': 'Ẩn',
  'hidden->draft': 'Chuyển về nháp',
  'hidden->published': 'Công khai (Admin)',
}

export function POIDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [poi, setPoi] = useState<POI | null>(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState<POIStatus | null>(null)

  useEffect(() => {
    const loadDetail = async () => {
      if (!id) return
      try {
        setLoading(true)
        const item = await fetchPoiById(id)
        setPoi(item)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Không tải được POI')
        setPoi(null)
      } finally {
        setLoading(false)
      }
    }
    void loadDetail()
  }, [id])

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
          icon={Store}
          title="Không tìm thấy POI"
          description="POI này không tồn tại hoặc đã bị xóa"
          actionLabel="Quay lại danh sách"
          onAction={() => navigate('/poi')}
        />
      </div>
    )
  }

  const availableTransitions = statusTransitions[poi.status] || []

  const handleStatusChange = (newStatus: POIStatus) => {
    setTargetStatus(newStatus)
    setStatusDialogOpen(true)
  }

  const confirmStatusChange = async () => {
    if (!targetStatus) return
    try {
      const updated = await updatePoiStatus(poi.id, targetStatus)
      setPoi(updated)
      toast.success(`Đã chuyển trạng thái từ "${poi.status}" sang "${targetStatus}"`)
      setStatusDialogOpen(false)
      setTargetStatus(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Cập nhật trạng thái thất bại')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/poi')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{poi.name}</h1>
            <StatusBadge status={poi.status} />
            {poi.riskFlag && (
              <Badge variant="outline" className="border-warning text-warning">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Rủi ro: {poi.riskScore || 0}/100
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">POI giản lược theo tên cửa hàng</p>
        </div>
      </div>

      {availableTransitions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Chuyển trạng thái</CardTitle>
            <CardDescription>Chọn trạng thái mới cho POI này</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={poi.status} />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              {availableTransitions.map((newStatus) => (
                <Button
                  key={newStatus}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(newStatus)}
                  className={cn(
                    newStatus === 'published' && 'border-success/50 text-success hover:bg-success/10',
                    newStatus === 'flagged' && 'border-warning/50 text-warning hover:bg-warning/10',
                    newStatus === 'hidden' && 'border-destructive/50 text-destructive hover:bg-destructive/10',
                    newStatus === 'draft' && 'border-muted-foreground/50'
                  )}
                >
                  {statusTransitionLabels[`${poi.status}->${newStatus}`] || newStatus}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Thông tin POI</CardTitle>
          <CardDescription>Thông tin cốt lõi của POI theo cửa hàng</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Tên cửa hàng:</span> {poi.name}
          </p>
          <p>
            <span className="text-muted-foreground">Chủ cửa hàng:</span> {poi.ownerName || '-'}
          </p>
          <p>
            <span className="text-muted-foreground">Địa chỉ:</span> {poi.address || '-'}
          </p>
          <p>
            <span className="text-muted-foreground">Tạo lúc:</span> {formatDateTime(poi.createdAt)}
          </p>
          <p>
            <span className="text-muted-foreground">Cập nhật:</span> {formatDateTime(poi.updatedAt)}
          </p>
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        title="Xác nhận chuyển trạng thái"
        description={`Bạn có chắc chắn muốn chuyển trạng thái POI này từ "${poi.status}" sang "${targetStatus}"?`}
        confirmLabel="Xác nhận"
        onConfirm={() => void confirmStatusChange()}
        variant={targetStatus === 'hidden' ? 'destructive' : 'default'}
      />
    </div>
  )
}
