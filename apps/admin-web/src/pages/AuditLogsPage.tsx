import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FileText,
  Calendar,
  User,
  Activity,
  Database,
  Settings,
  Briefcase,
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DataTableToolbar } from '@/components/shared/DataTableToolbar'
import { FilterBar, type FilterConfig } from '@/components/shared/FilterBar'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn, formatDateTime, getActionName, getModuleName } from '@/lib/utils'
import {
  fetchAdminAuditLogs,
  fetchAllAdminAuditLogs,
  type AdminAuditLogItem,
  type AuditLogUiAction,
  type AuditLogUiModule,
} from '@/services/adminAuditLogService'

const PAGE_SIZE = 15

const moduleOptions = [
  { value: 'poi', label: 'POI' },
  { value: 'user', label: 'Người dùng' },
  { value: 'job', label: 'Hàng đợi' },
  { value: 'system', label: 'Hệ thống' },
  { value: 'settings', label: 'Cài đặt' },
]

const actionOptions = [
  { value: 'create', label: 'Tạo mới' },
  { value: 'update', label: 'Cập nhật' },
  { value: 'delete', label: 'Xóa' },
  { value: 'status_change', label: 'Đổi trạng thái' },
  { value: 'login', label: 'Đăng nhập' },
  { value: 'logout', label: 'Đăng xuất' },
  { value: 'read', label: 'Xem' },
]

const methodOptions = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
]

function getModuleIcon(module: AuditLogUiModule) {
  switch (module) {
    case 'poi':
      return Database
    case 'user':
      return User
    case 'job':
      return Briefcase
    case 'settings':
      return Settings
    case 'system':
    default:
      return Activity
  }
}

function getActionColor(action: AuditLogUiAction): string {
  switch (action) {
    case 'create':
      return 'bg-success/10 text-success border-success/20'
    case 'update':
      return 'bg-info/10 text-info border-info/20'
    case 'delete':
      return 'bg-destructive/10 text-destructive border-destructive/20'
    case 'status_change':
      return 'bg-warning/10 text-warning-foreground border-warning/20'
    case 'login':
      return 'bg-success/10 text-success border-success/20'
    case 'logout':
      return 'bg-muted text-muted-foreground border-border'
    case 'read':
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

function getStatusCodeClass(statusCode?: number): string {
  if (!statusCode) return 'bg-muted text-muted-foreground border-border'
  if (statusCode >= 500) return 'bg-destructive/10 text-destructive border-destructive/20'
  if (statusCode >= 400) return 'bg-warning/10 text-warning-foreground border-warning/20'
  return 'bg-success/10 text-success border-success/20'
}

function escapeCsv(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function applyFilters(
  items: AdminAuditLogItem[],
  search: string,
  filters: Record<string, string>
): AdminAuditLogItem[] {
  return items.filter((log) => {
    if (search) {
      const searchLower = search.toLowerCase()
      const haystack = [
        log.actor,
        log.path,
        log.method,
        log.detail ?? '',
        String(log.statusCode ?? ''),
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(searchLower)) {
        return false
      }
    }

    if (filters.module && filters.module !== 'all' && log.module !== filters.module) {
      return false
    }

    if (filters.action && filters.action !== 'all' && log.action !== filters.action) {
      return false
    }

    if (filters.method && filters.method !== 'all' && log.method !== filters.method) {
      return false
    }

    return true
  })
}

export function AuditLogsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const filterConfigs: FilterConfig[] = [
    { key: 'module', label: 'Module', options: moduleOptions, value: filters.module },
    { key: 'action', label: 'Hành động', options: actionOptions, value: filters.action },
    { key: 'method', label: 'HTTP', options: methodOptions, value: filters.method },
  ]

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const hasActiveFilters = useMemo(
    () => Boolean(search) || Object.values(filters).some((v) => v && v !== 'all'),
    [search, filters]
  )
  const hasActiveQuery = useMemo(
    () => Boolean(debouncedSearch) || Object.values(filters).some((v) => v && v !== 'all'),
    [debouncedSearch, filters]
  )

  const loadLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      if (hasActiveQuery) {
        const allLogs = await fetchAllAdminAuditLogs({ pageSize: 100, maxPages: 80 })
        const filteredLogs = applyFilters(allLogs, debouncedSearch, filters)

        const resolvedTotalPages = Math.max(Math.ceil(filteredLogs.length / pageSize), 1)
        if (currentPage > resolvedTotalPages) {
          setCurrentPage(resolvedTotalPages)
          return
        }

        const start = (currentPage - 1) * pageSize
        setLogs(filteredLogs.slice(start, start + pageSize))
        setTotalItems(filteredLogs.length)
        setTotalPages(resolvedTotalPages)
      } else {
        const result = await fetchAdminAuditLogs({ page: currentPage, size: pageSize })
        if (result.totalPages > 0 && currentPage > result.totalPages) {
          setCurrentPage(result.totalPages)
          return
        }
        setLogs(result.items)
        setTotalItems(result.totalItems || 0)
        setTotalPages(Math.max(result.totalPages || 1, 1))
      }
    } catch (error) {
      setLogs([])
      setTotalItems(0)
      setTotalPages(1)
      toast.error(error instanceof Error ? error.message : 'Không tải được nhật ký hệ thống')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [currentPage, pageSize, hasActiveQuery, debouncedSearch, filters])

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

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

  const handleRefresh = () => {
    setIsRefreshing(true)
    void loadLogs()
  }

  const handleExport = () => {
    if (logs.length === 0) {
      toast.error('Không có dữ liệu để xuất')
      return
    }

    const headers = ['Thời gian', 'Người thực hiện', 'Hành động', 'HTTP', 'Endpoint', 'Status', 'Chi tiết']
    const rows = logs.map((log) => [
      formatDateTime(log.timestamp),
      log.actor,
      getActionName(log.action),
      log.method,
      log.path,
      String(log.statusCode ?? ''),
      log.detail ?? '',
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsv(cell)).join(','))
      .join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `admin-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    toast.success('Đã xuất file nhật ký')
  }

  return (
    <div className="space-y-6">
      <DataTableToolbar
        title="Nhật ký hệ thống"
        description="Theo dõi các hoạt động và thay đổi trong hệ thống"
        onRefresh={handleRefresh}
        isLoading={isRefreshing || isLoading}
        onExport={handleExport}
      />

      <FilterBar
        searchPlaceholder="Tìm theo người thực hiện, endpoint, chi tiết..."
        searchValue={search}
        onSearchChange={handleSearchChange}
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {isLoading ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Đang tải nhật ký hệ thống...
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Không có nhật ký nào"
          description={
            hasActiveFilters
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
              : 'Chưa có hoạt động nào được ghi nhận'
          }
        />
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Thời gian</TableHead>
                  <TableHead>Người thực hiện</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Hành động</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>HTTP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const ModuleIcon = getModuleIcon(log.module)
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">{formatDateTime(log.timestamp)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {log.actor
                                .replace(/@/g, ' ')
                                .trim()
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{log.actor}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ModuleIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{getModuleName(log.module)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getActionColor(log.action)}>
                          {getActionName(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="max-w-[220px] truncate text-xs text-muted-foreground" title={log.path}>
                          {log.path}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {log.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('font-mono', getStatusCodeClass(log.statusCode))}>
                          {log.statusCode ?? '--'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.detail ? (
                          <div className="max-w-[220px] truncate text-sm text-muted-foreground" title={log.detail}>
                            {log.detail}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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
    </div>
  )
}
