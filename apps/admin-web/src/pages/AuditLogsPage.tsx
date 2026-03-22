import { useState, useMemo } from 'react'
import { FileText, Download, Calendar, User, Activity, Database, Settings, Briefcase } from 'lucide-react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DataTableToolbar } from '@/components/shared/DataTableToolbar'
import { FilterBar, type FilterConfig } from '@/components/shared/FilterBar'
import { Pagination } from '@/components/shared/Pagination'
import { AuditDiffCell } from '@/components/shared/AuditDiffCell'
import { EmptyState } from '@/components/shared/EmptyState'
import { auditLogs, users } from '@/data/mock-data'
import type { AuditModule, AuditAction } from '@/types'
import { formatDateTime, getModuleName, getActionName } from '@/lib/utils'

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
]

const actorOptions = users.map((u) => ({ value: u.id, label: u.name }))

function getModuleIcon(module: AuditModule) {
  switch (module) {
    case 'poi':
      return Database
    case 'user':
      return User
    case 'job':
      return Briefcase
    case 'system':
      return Activity
    case 'settings':
      return Settings
    default:
      return Activity
  }
}

function getActionColor(action: AuditAction): string {
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
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

export function AuditLogsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})

  const filterConfigs: FilterConfig[] = [
    { key: 'module', label: 'Module', options: moduleOptions, value: filters.module },
    { key: 'action', label: 'Hành động', options: actionOptions, value: filters.action },
    { key: 'actor', label: 'Người thực hiện', options: actorOptions, value: filters.actor },
  ]

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        if (
          !log.actor.toLowerCase().includes(searchLower) &&
          !log.entity.toLowerCase().includes(searchLower) &&
          !(log.reason?.toLowerCase().includes(searchLower))
        ) {
          return false
        }
      }

      // Module filter
      if (filters.module && filters.module !== 'all' && log.module !== filters.module) {
        return false
      }

      // Action filter
      if (filters.action && filters.action !== 'all' && log.action !== filters.action) {
        return false
      }

      // Actor filter
      if (filters.actor && filters.actor !== 'all' && log.actorId !== filters.actor) {
        return false
      }

      return true
    })
  }, [search, filters])

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredLogs.slice(start, start + pageSize)
  }, [filteredLogs, currentPage, pageSize])

  const totalPages = Math.ceil(filteredLogs.length / pageSize)

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

  const handleExport = () => {
    toast.success('Đã bắt đầu xuất file nhật ký...')
    // Simulate export
    setTimeout(() => {
      toast.success('Đã xuất file nhật ký thành công!')
    }, 2000)
  }

  const getActorAvatar = (actorId: string) => {
    const user = users.find((u) => u.id === actorId)
    return user?.avatar
  }

  return (
    <div className="space-y-6">
      <DataTableToolbar
        title="Nhật ký hệ thống"
        description="Theo dõi các hoạt động và thay đổi trong hệ thống"
        onExport={handleExport}
      />

      <FilterBar
        searchPlaceholder="Tìm theo người thực hiện, entity, lý do..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {paginatedLogs.length === 0 ? (
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
                  <TableHead>Entity</TableHead>
                  <TableHead>Thay đổi</TableHead>
                  <TableHead>Lý do</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => {
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
                            <AvatarImage src={getActorAvatar(log.actorId)} />
                            <AvatarFallback className="text-xs">
                              {log.actor.slice(0, 2)}
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
                        <div className="max-w-[150px] truncate text-sm" title={log.entity}>
                          {log.entity}
                        </div>
                      </TableCell>
                      <TableCell>
                        <AuditDiffCell before={log.before} after={log.after} />
                      </TableCell>
                      <TableCell>
                        {log.reason ? (
                          <div className="max-w-[150px] truncate text-sm text-muted-foreground" title={log.reason}>
                            {log.reason}
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
            totalItems={filteredLogs.length}
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
