import { useState, useMemo } from 'react'
import {
  MoreHorizontal,
  RefreshCw,
  XCircle,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ListTodo,
  Play,
} from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DataTableToolbar } from '@/components/shared/DataTableToolbar'
import { FilterBar, type FilterConfig } from '@/components/shared/FilterBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Pagination } from '@/components/shared/Pagination'
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { jobs } from '@/data/mock-data'
import type { Job, JobStatus, JobType } from '@/types'
import { formatDateTime, getJobTypeName } from '@/lib/utils'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

const statusOptions = [
  { value: 'queued', label: 'Đang chờ' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'failed', label: 'Thất bại' },
  { value: 'done', label: 'Hoàn thành' },
]

const typeOptions = [
  { value: 'audio_generation', label: 'Tạo audio' },
  { value: 'content_moderation', label: 'Kiểm duyệt nội dung' },
  { value: 'image_processing', label: 'Xử lý ảnh' },
  { value: 'data_sync', label: 'Đồng bộ dữ liệu' },
]

function getStatusIcon(status: JobStatus) {
  switch (status) {
    case 'queued':
      return Clock
    case 'processing':
      return Loader2
    case 'failed':
      return AlertTriangle
    case 'done':
      return CheckCircle
    default:
      return Clock
  }
}

export function JobsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [retryDialogOpen, setRetryDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const filterConfigs: FilterConfig[] = [
    { key: 'status', label: 'Trạng thái', options: statusOptions, value: filters.status },
    { key: 'type', label: 'Loại job', options: typeOptions, value: filters.type },
  ]

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        if (
          !job.id.toLowerCase().includes(searchLower) &&
          !(job.relatedPOI?.toLowerCase().includes(searchLower)) &&
          !(job.relatedUser?.toLowerCase().includes(searchLower))
        ) {
          return false
        }
      }

      // Status filter
      if (filters.status && filters.status !== 'all' && job.status !== filters.status) {
        return false
      }

      // Type filter
      if (filters.type && filters.type !== 'all' && job.type !== filters.type) {
        return false
      }

      return true
    })
  }, [search, filters])

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredJobs.slice(start, start + pageSize)
  }, [filteredJobs, currentPage, pageSize])

  const totalPages = Math.ceil(filteredJobs.length / pageSize)

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

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      toast.success('Đã làm mới danh sách job')
    }, 1000)
  }

  const handleViewDetail = (job: Job) => {
    setSelectedJob(job)
    setDetailSheetOpen(true)
  }

  const handleRetry = (job: Job) => {
    setSelectedJob(job)
    setRetryDialogOpen(true)
  }

  const handleCancel = (job: Job) => {
    setSelectedJob(job)
    setCancelDialogOpen(true)
  }

  const confirmRetry = () => {
    if (selectedJob) {
      toast.success(`Đã thêm job "${selectedJob.id}" vào hàng đợi retry`)
      setRetryDialogOpen(false)
    }
  }

  const confirmCancel = () => {
    if (selectedJob) {
      toast.success(`Đã hủy job "${selectedJob.id}"`)
      setCancelDialogOpen(false)
    }
  }

  // Stats
  const stats = useMemo(() => {
    const total = jobs.length
    const queued = jobs.filter((j) => j.status === 'queued').length
    const processing = jobs.filter((j) => j.status === 'processing').length
    const failed = jobs.filter((j) => j.status === 'failed').length
    const done = jobs.filter((j) => j.status === 'done').length
    return { total, queued, processing, failed, done }
  }, [])

  return (
    <div className="space-y-6">
      <DataTableToolbar
        title="Hàng đợi xử lý"
        description="Quản lý các job đang chờ và đã xử lý"
        onRefresh={handleRefresh}
        isLoading={isRefreshing}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Tổng job</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Đang chờ</p>
          <p className="text-2xl font-bold text-info">{stats.queued}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Đang xử lý</p>
          <p className="text-2xl font-bold text-info">{stats.processing}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Thất bại</p>
          <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Hoàn thành</p>
          <p className="text-2xl font-bold text-success">{stats.done}</p>
        </div>
      </div>

      <FilterBar
        searchPlaceholder="Tìm theo Job ID, POI, User..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {paginatedJobs.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="Không có job nào"
          description={
            hasActiveFilters
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
              : 'Chưa có job nào trong hàng đợi'
          }
        />
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Loại job</TableHead>
                  <TableHead>POI/User liên quan</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Retry</TableHead>
                  <TableHead>Bắt đầu</TableHead>
                  <TableHead>Kết thúc</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedJobs.map((job) => {
                  const StatusIcon = getStatusIcon(job.status)
                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                          {job.id}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getJobTypeName(job.type)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {job.relatedPOI && <p>{job.relatedPOI}</p>}
                          {job.relatedUser && (
                            <p className="text-muted-foreground">{job.relatedUser}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon
                            className={cn(
                              'h-4 w-4',
                              job.status === 'done' && 'text-success',
                              job.status === 'failed' && 'text-destructive',
                              job.status === 'processing' && 'text-info animate-spin',
                              job.status === 'queued' && 'text-muted-foreground'
                            )}
                          />
                          <StatusBadge status={job.status} />
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.retryCount > 0 ? (
                          <Badge variant={job.retryCount >= 3 ? 'destructive' : 'secondary'}>
                            {job.retryCount}/3
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {job.startedAt ? formatDateTime(job.startedAt) : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {job.endedAt ? formatDateTime(job.endedAt) : '-'}
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
                            <DropdownMenuItem onClick={() => handleViewDetail(job)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            {job.status === 'failed' && job.retryCount < 3 && (
                              <DropdownMenuItem onClick={() => handleRetry(job)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Retry
                              </DropdownMenuItem>
                            )}
                            {job.status === 'queued' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleCancel(job)}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Hủy job
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredJobs.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </>
      )}

      {/* Job Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Chi tiết Job</SheetTitle>
            <SheetDescription>Thông tin và log của job</SheetDescription>
          </SheetHeader>
          {selectedJob && (
            <ScrollArea className="mt-6 h-[calc(100vh-200px)]">
              <div className="space-y-6 pr-4">
                {/* Job Info */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Job ID</p>
                    <code className="text-sm font-mono">{selectedJob.id}</code>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Loại job</p>
                    <Badge variant="outline">{getJobTypeName(selectedJob.type)}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trạng thái</p>
                    <StatusBadge status={selectedJob.status} />
                  </div>
                  {selectedJob.relatedPOI && (
                    <div>
                      <p className="text-sm text-muted-foreground">POI liên quan</p>
                      <p className="text-sm">{selectedJob.relatedPOI}</p>
                    </div>
                  )}
                  {selectedJob.relatedUser && (
                    <div>
                      <p className="text-sm text-muted-foreground">User liên quan</p>
                      <p className="text-sm">{selectedJob.relatedUser}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Retry count</p>
                    <p className="text-sm">{selectedJob.retryCount}/3</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Timeline</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tạo lúc:</span>
                      <span>{formatDateTime(selectedJob.createdAt)}</span>
                    </div>
                    {selectedJob.startedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bắt đầu:</span>
                        <span>{formatDateTime(selectedJob.startedAt)}</span>
                      </div>
                    )}
                    {selectedJob.endedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kết thúc:</span>
                        <span>{formatDateTime(selectedJob.endedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Log */}
                {selectedJob.error && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-destructive">Chi tiết lỗi</p>
                    <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                      <pre className="whitespace-pre-wrap text-xs text-destructive">
                        {selectedJob.error}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  {selectedJob.status === 'failed' && selectedJob.retryCount < 3 && (
                    <Button onClick={() => handleRetry(selectedJob)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry Job
                    </Button>
                  )}
                  {selectedJob.status === 'queued' && (
                    <Button variant="destructive" onClick={() => handleCancel(selectedJob)}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Hủy Job
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Retry Confirmation */}
      <ConfirmActionDialog
        open={retryDialogOpen}
        onOpenChange={setRetryDialogOpen}
        title="Retry Job"
        description={`Bạn có chắc chắn muốn retry job "${selectedJob?.id}"? Job sẽ được thêm vào hàng đợi và xử lý lại.`}
        confirmLabel="Retry"
        onConfirm={confirmRetry}
      />

      {/* Cancel Confirmation */}
      <ConfirmActionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Hủy Job"
        description={`Bạn có chắc chắn muốn hủy job "${selectedJob?.id}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Hủy job"
        onConfirm={confirmCancel}
        variant="destructive"
      />
    </div>
  )
}
