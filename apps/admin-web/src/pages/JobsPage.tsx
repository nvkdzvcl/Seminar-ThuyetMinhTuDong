import { useCallback, useEffect, useState } from 'react'
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
import type { JobStatus, JobType } from '@/types'
import { formatDateTime, getJobTypeName } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  cancelAdminJob,
  fetchAdminJobs,
  fetchAdminJobsSummary,
  retryAdminJob,
  type AdminJob,
  type AdminJobsSummary,
} from '@/services/adminJobService'

const PAGE_SIZE = 10

const statusOptions = [
  { value: 'queued', label: 'Đang chờ' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'failed', label: 'Thất bại' },
  { value: 'done', label: 'Hoàn thành' },
  { value: 'canceled', label: 'Đã hủy' },
]

const typeOptions = [
  { value: 'audio_generation', label: 'Tạo audio' },
  { value: 'content_moderation', label: 'Kiểm duyệt nội dung' },
  { value: 'image_processing', label: 'Xử lý ảnh' },
  { value: 'data_sync', label: 'Đồng bộ dữ liệu' },
]

const INITIAL_STATS: AdminJobsSummary = {
  total: 0,
  queued: 0,
  processing: 0,
  failed: 0,
  done: 0,
  canceled: 0,
}

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
    case 'canceled':
      return XCircle
    default:
      return Clock
  }
}

export function JobsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [jobs, setJobs] = useState<AdminJob[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<AdminJobsSummary>(INITIAL_STATS)
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [retryDialogOpen, setRetryDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const filterConfigs: FilterConfig[] = [
    { key: 'status', label: 'Trạng thái', options: statusOptions, value: filters.status },
    { key: 'type', label: 'Loại job', options: typeOptions, value: filters.type },
  ]

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadJobs = useCallback(async () => {
    setIsLoading(true)
    try {
      const [jobsResponse, summary] = await Promise.all([
        fetchAdminJobs({
          page: currentPage,
          size: pageSize,
          search: debouncedSearch || undefined,
          status:
            filters.status && filters.status !== 'all'
              ? (filters.status as JobStatus)
              : undefined,
          type:
            filters.type && filters.type !== 'all'
              ? (filters.type as JobType)
              : undefined,
        }),
        fetchAdminJobsSummary(),
      ])

      if (jobsResponse.totalPages > 0 && currentPage > jobsResponse.totalPages) {
        setCurrentPage(jobsResponse.totalPages)
        return
      }

      setJobs(jobsResponse.items)
      setTotalItems(jobsResponse.totalItems || 0)
      setTotalPages(Math.max(jobsResponse.totalPages || 1, 1))
      setStats(summary)
    } catch (error) {
      setJobs([])
      setTotalItems(0)
      setTotalPages(1)
      setStats(INITIAL_STATS)
      toast.error(error instanceof Error ? error.message : 'Không tải được danh sách job')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [currentPage, pageSize, debouncedSearch, filters.status, filters.type])

  useEffect(() => {
    void loadJobs()
  }, [loadJobs])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
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
    void loadJobs()
  }

  const handleViewDetail = (job: AdminJob) => {
    setSelectedJob(job)
    setDetailSheetOpen(true)
  }

  const handleRetry = (job: AdminJob) => {
    setSelectedJob(job)
    setRetryDialogOpen(true)
  }

  const handleCancel = (job: AdminJob) => {
    setSelectedJob(job)
    setCancelDialogOpen(true)
  }

  const confirmRetry = async () => {
    if (!selectedJob) return
    try {
      const updated = await retryAdminJob(selectedJob)
      setRetryDialogOpen(false)
      setSelectedJob(updated)
      toast.success(`Đã thêm job "${selectedJob.id}" vào hàng đợi retry`)
      void loadJobs()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể retry job')
    }
  }

  const confirmCancel = async () => {
    if (!selectedJob) return
    try {
      const updated = await cancelAdminJob(selectedJob)
      setCancelDialogOpen(false)
      setSelectedJob(updated)
      toast.success(`Đã hủy job "${selectedJob.id}"`)
      void loadJobs()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể hủy job')
    }
  }

  return (
    <div className="space-y-6">
      <DataTableToolbar
        title="Hàng đợi xử lý"
        description="Quản lý các job đang chờ và đã xử lý"
        onRefresh={handleRefresh}
        isLoading={isRefreshing || isLoading}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
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
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Đã hủy</p>
          <p className="text-2xl font-bold text-muted-foreground">{stats.canceled}</p>
        </div>
      </div>

      <FilterBar
        searchPlaceholder="Tìm theo Job ID, POI, User..."
        searchValue={search}
        onSearchChange={handleSearchChange}
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {isLoading ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Đang tải danh sách job...
        </div>
      ) : jobs.length === 0 ? (
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
                {jobs.map((job) => {
                  const StatusIcon = getStatusIcon(job.status)
                  return (
                    <TableRow key={job.backendId}>
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
                              job.status === 'queued' && 'text-muted-foreground',
                              job.status === 'canceled' && 'text-muted-foreground'
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
                            {(job.status === 'queued' || job.status === 'processing') && (
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
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </>
      )}

      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Chi tiết Job</SheetTitle>
            <SheetDescription>Thông tin và log của job</SheetDescription>
          </SheetHeader>
          {selectedJob && (
            <ScrollArea className="mt-6 h-[calc(100vh-200px)]">
              <div className="space-y-6 pr-4">
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

                <div className="flex gap-2 pt-4">
                  {selectedJob.status === 'failed' && selectedJob.retryCount < 3 && (
                    <Button onClick={() => handleRetry(selectedJob)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry Job
                    </Button>
                  )}
                  {(selectedJob.status === 'queued' || selectedJob.status === 'processing') && (
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

      <ConfirmActionDialog
        open={retryDialogOpen}
        onOpenChange={setRetryDialogOpen}
        title="Retry Job"
        description={`Bạn có chắc chắn muốn retry job "${selectedJob?.id}"? Job sẽ được thêm vào hàng đợi và xử lý lại.`}
        confirmLabel="Retry"
        onConfirm={confirmRetry}
      />

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
