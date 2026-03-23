import { useState, useMemo } from 'react'
import {
  MoreHorizontal,
  Eye,
  Lock,
  Unlock,
  UserCog,
  Users,
  Shield,
  Store,
  Clock,
  Mail,
  Phone,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DataTableToolbar } from '@/components/shared/DataTableToolbar'
import { FilterBar, type FilterConfig } from '@/components/shared/FilterBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Pagination } from '@/components/shared/Pagination'
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { users, auditLogs } from '@/data/mock-data'
import type { User, UserRole, UserStatus } from '@/types'
import { formatDateTime, formatRelativeTime, getRoleName } from '@/lib/utils'

const PAGE_SIZE = 10

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'customer', label: 'Khách hàng' },
  { value: 'store_owner', label: 'Chủ cửa hàng' },
]

const statusOptions = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'suspended', label: 'Tạm ngưng' },
]

function getRoleIcon(role: UserRole) {
  switch (role) {
    case 'super_admin':
      return Shield
    case 'customer':
      return UserCog
    case 'store_owner':
      return Store
    default:
      return Users
  }
}

export function UsersPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusAction, setStatusAction] = useState<'lock' | 'unlock'>('lock')

  const filterConfigs: FilterConfig[] = [
    { key: 'role', label: 'Vai trò', options: roleOptions, value: filters.role },
    { key: 'status', label: 'Trạng thái', options: statusOptions, value: filters.status },
  ]

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        if (
          !user.name.toLowerCase().includes(searchLower) &&
          !user.email.toLowerCase().includes(searchLower) &&
          !user.phoneNumber.toLowerCase().includes(searchLower)
        ) {
          return false
        }
      }

      // Role filter
      if (filters.role && filters.role !== 'all' && user.role !== filters.role) {
        return false
      }

      // Status filter
      if (filters.status && filters.status !== 'all' && user.status !== filters.status) {
        return false
      }

      return true
    })
  }, [search, filters])

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, currentPage, pageSize])

  const totalPages = Math.ceil(filteredUsers.length / pageSize)

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

  const handleViewDetail = (user: User) => {
    setSelectedUser(user)
    setDetailSheetOpen(true)
  }

  const handleToggleStatus = (user: User, action: 'lock' | 'unlock') => {
    setSelectedUser(user)
    setStatusAction(action)
    setStatusDialogOpen(true)
  }

  const confirmStatusChange = () => {
    if (selectedUser) {
      const newStatus = statusAction === 'lock' ? 'suspended' : 'active'
      toast.success(
        `Đã ${statusAction === 'lock' ? 'khóa' : 'mở khóa'} tài khoản "${selectedUser.name}"`
      )
      setStatusDialogOpen(false)
    }
  }

  const handleChangeRole = (user: User, newRole: UserRole) => {
    toast.success(`Đã đổi vai trò của "${user.name}" thành "${getRoleName(newRole)}"`)
  }

  const userActivity = useMemo(() => {
    if (!selectedUser) return []
    return auditLogs
      .filter((log) => log.actorId === selectedUser.id)
      .slice(0, 5)
  }, [selectedUser])

  return (
    <div className="space-y-6">
      <DataTableToolbar
        title="Quản lý người dùng"
        description="Quản lý tài khoản người dùng trong hệ thống"
      />

      <FilterBar
        searchPlaceholder="Tìm theo tên, email, số điện thoại..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {paginatedUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Không tìm thấy người dùng"
          description={
            hasActiveFilters
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
              : 'Chưa có người dùng nào trong hệ thống'
          }
        />
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => {
                  const RoleIcon = getRoleIcon(user.role)
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>
                              {user.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-muted-foreground">{user.phoneNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <RoleIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{getRoleName(user.role)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={user.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(user.createdAt)}
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
                            <DropdownMenuItem onClick={() => handleViewDetail(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <UserCog className="mr-2 h-4 w-4" />
                                Đổi vai trò
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {roleOptions.map((role) => (
                                  <DropdownMenuItem
                                    key={role.value}
                                    disabled={user.role === role.value}
                                    onClick={() =>
                                      handleChangeRole(user, role.value as UserRole)
                                    }
                                  >
                                    {role.label}
                                    {user.role === role.value && (
                                      <Badge variant="secondary" className="ml-2">
                                        Hiện tại
                                      </Badge>
                                    )}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            {user.status === 'active' ? (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleToggleStatus(user, 'lock')}
                              >
                                <Lock className="mr-2 h-4 w-4" />
                                Khóa tài khoản
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-success"
                                onClick={() => handleToggleStatus(user, 'unlock')}
                              >
                                <Unlock className="mr-2 h-4 w-4" />
                                Mở khóa tài khoản
                              </DropdownMenuItem>
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
            totalItems={filteredUsers.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </>
      )}

      {/* User Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Chi tiết người dùng</SheetTitle>
            <SheetDescription>Thông tin và hoạt động gần đây</SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="mt-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                  <AvatarFallback className="text-lg">
                    {selectedUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{getRoleName(selectedUser.role)}</p>
                  <StatusBadge status={selectedUser.status} className="mt-1" />
                </div>
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Thông tin liên hệ</h4>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedUser.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedUser.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Hoạt động lần cuối:{' '}
                    {selectedUser.lastActivity
                      ? formatRelativeTime(selectedUser.lastActivity)
                      : 'Không xác định'}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Recent Activity */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Hoạt động gần đây</h4>
                {userActivity.length > 0 ? (
                  <div className="space-y-3">
                    {userActivity.map((activity) => (
                      <div key={activity.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{activity.action}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(activity.timestamp)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {activity.module} - {activity.entity}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa có hoạt động nào được ghi nhận</p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Status Change Confirmation */}
      <ConfirmActionDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        title={statusAction === 'lock' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
        description={
          statusAction === 'lock'
            ? `Bạn có chắc chắn muốn khóa tài khoản "${selectedUser?.name}"? Người dùng này sẽ không thể đăng nhập.`
            : `Bạn có chắc chắn muốn mở khóa tài khoản "${selectedUser?.name}"?`
        }
        confirmLabel={statusAction === 'lock' ? 'Khóa' : 'Mở khóa'}
        onConfirm={confirmStatusChange}
        variant={statusAction === 'lock' ? 'destructive' : 'default'}
      />
    </div>
  )
}
