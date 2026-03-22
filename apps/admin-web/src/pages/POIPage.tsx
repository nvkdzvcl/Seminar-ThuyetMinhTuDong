import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal, Eye, EyeOff, Trash2, AlertTriangle, Store } from 'lucide-react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTableToolbar } from '@/components/shared/DataTableToolbar'
import { FilterBar, type FilterConfig } from '@/components/shared/FilterBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Pagination } from '@/components/shared/Pagination'
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import type { POI, POIStatus } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { createPoi, deletePoi, fetchPois, updatePoiStatus } from '@/services/poiService'
import { fetchShopOptions, type ShopOption } from '@/services/shopService'

const PAGE_SIZE = 10

const statusOptions = [
  { value: 'draft', label: 'Nháp' },
  { value: 'published', label: 'Công khai' },
  { value: 'flagged', label: 'Gắn cờ' },
  { value: 'hidden', label: 'Ẩn' },
]

export function POIPage() {
  const navigate = useNavigate()
  const [pois, setPois] = useState<POI[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [shopOptions, setShopOptions] = useState<ShopOption[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null)
  const [selectedShopId, setSelectedShopId] = useState('')

  const filterConfigs: FilterConfig[] = [
    { key: 'status', label: 'Trạng thái', options: statusOptions, value: filters.status },
    {
      key: 'hasFlag',
      label: 'Cờ rủi ro',
      options: [
        { value: 'true', label: 'Có cờ' },
        { value: 'false', label: 'Không có cờ' },
      ],
      value: filters.hasFlag,
    },
  ]

  const loadPois = async () => {
    try {
      setLoading(true)
      const result = await fetchPois({
        page: currentPage,
        size: pageSize,
        search: search || undefined,
        status: filters.status && filters.status !== 'all' ? (filters.status as POIStatus) : undefined,
        hasFlag: filters.hasFlag && filters.hasFlag !== 'all' ? filters.hasFlag === 'true' : undefined,
      })
      setPois(result.items)
      setTotalItems(result.totalItems)
      setTotalPages(result.totalPages || 1)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không tải được danh sách POI')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPois()
  }, [currentPage, pageSize, search, filters])

  useEffect(() => {
    const loadShops = async () => {
      try {
        const shops = await fetchShopOptions()
        setShopOptions(shops)
      } catch {
        setShopOptions([])
      }
    }
    void loadShops()
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearch('')
    setCurrentPage(1)
  }

  const hasActiveFilters = Boolean(search) || Object.values(filters).some((v) => v && v !== 'all')

  const handleCreate = () => {
    setSelectedShopId('')
    setCreateDialogOpen(true)
  }

  const handleSubmitCreate = async () => {
    if (!selectedShopId) {
      toast.error('Vui lòng chọn cửa hàng')
      return
    }
    try {
      await createPoi({
        shopId: Number(selectedShopId),
      })
      toast.success('Đã tạo POI mới từ cửa hàng thành công!')
      setCreateDialogOpen(false)
      await loadPois()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Tạo POI thất bại')
    }
  }

  const handleToggleVisibility = async (poi: POI) => {
    const newStatus: POIStatus = poi.status === 'hidden' ? 'draft' : 'hidden'
    try {
      await updatePoiStatus(poi.id, newStatus)
      toast.success(`Đã ${newStatus === 'hidden' ? 'ẩn' : 'hiện'} POI "${poi.name}"`)
      await loadPois()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Cập nhật trạng thái thất bại')
    }
  }

  const handleDelete = async () => {
    if (!selectedPOI) return
    try {
      await deletePoi(selectedPOI.id)
      toast.success(`Đã xóa POI "${selectedPOI.name}"`)
      setDeleteDialogOpen(false)
      setSelectedPOI(null)
      await loadPois()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Xóa POI thất bại')
    }
  }

  return (
    <div className="space-y-6">
      <DataTableToolbar
        title="Quản lý POI"
        description="POI hiện được giản lược theo tên cửa hàng"
        onAdd={handleCreate}
        addLabel="Tạo POI từ cửa hàng"
      />

      <FilterBar
        searchPlaceholder="Tìm theo tên cửa hàng..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {loading ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Đang tải dữ liệu POI...
        </div>
      ) : pois.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Không tìm thấy POI nào"
          description={hasActiveFilters ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm' : 'Bắt đầu bằng cách tạo POI mới'}
          actionLabel={!hasActiveFilters ? 'Tạo POI mới' : undefined}
          onAction={!hasActiveFilters ? handleCreate : undefined}
        />
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên cửa hàng (POI)</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Chủ cửa hàng</TableHead>
                  <TableHead>Cập nhật lần cuối</TableHead>
                  <TableHead>Cờ rủi ro</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pois.map((poi) => (
                  <TableRow key={poi.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Store className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="font-medium">{poi.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={poi.status} />
                    </TableCell>
                    <TableCell>{poi.ownerName || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(poi.updatedAt)}
                    </TableCell>
                    <TableCell>
                      {poi.riskFlag ? (
                        <div className="flex items-center gap-1 text-warning">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs">{poi.riskScore || 0}/100</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Mở menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/poi/${poi.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void handleToggleVisibility(poi)}>
                            <EyeOff className="mr-2 h-4 w-4" />
                            {poi.status === 'hidden' ? 'Hiện' : 'Ẩn'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedPOI(poi)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo POI từ cửa hàng</DialogTitle>
            <DialogDescription>POI sẽ lấy theo tên cửa hàng đã chọn</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label>Cửa hàng</Label>
            <Select value={selectedShopId} onValueChange={setSelectedShopId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn cửa hàng" />
              </SelectTrigger>
              <SelectContent>
                {shopOptions.map((shop) => (
                  <SelectItem key={shop.value} value={shop.value}>
                    {shop.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void handleSubmitCreate()}>Tạo POI</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Xóa POI"
        description={`Bạn có chắc chắn muốn xóa POI "${selectedPOI?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        onConfirm={() => void handleDelete()}
        variant="destructive"
      />
    </div>
  )
}
