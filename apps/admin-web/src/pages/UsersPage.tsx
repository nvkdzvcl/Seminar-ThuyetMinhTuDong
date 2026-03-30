import { useCallback, useEffect, useState } from 'react'
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
import type { User, UserRole, UserStatus } from '@/types'
import { formatDateTime, formatRelativeTime, getRoleName } from '@/lib/utils'
import {
  fetchAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
} from '@/services/userService'

const PAGE_SIZE = 10

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
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
    case 'admin':
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [users, setUsers] = useState<User[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusAction, setStatusAction] = useState<'lock' | 'unlock'>('lock')

  const filterConfigs: FilterConfig[] = [
    { key: 'role', label: 'Vai trò', options: roleOptions, value: filters.role },
    { key: 'status', label: 'Trạng thái', options: statusOptions, value: filters.status },
  ]

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await fetchAdminUsers({
        page: currentPage,
        size: pageSize,
        search: debouncedSearch || undefined,
        role:
          filters.role && filters.role !== 'all' ? (filters.role as UserRole) : undefined,
        status:
          filters.status && filters.status !== 'all'
            ? (filters.status as UserStatus)
            : undefined,
      })

      if (result.totalPages > 0 && currentPage > result.totalPages) {
        setCurrentPage(result.totalPages)
        return
      }

      setUsers(result.items)
      setTotalItems(result.totalItems || 0)
      setTotalPages(Math.max(result.totalPages || 1, 1))
    } catch (error) {
      setUsers([])
      setTotalItems(0)
      setTotalPages(1)
      toast.error(error instanceof Error ? error.message : 'Không tải được danh sách người dùng')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, debouncedSearch, filters.role, filters.status])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

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

  const handleViewDetail = (user: User) => {
    setSelectedUser(user)
    setDetailSheetOpen(true)
  }

  const handleToggleStatus = (user: User, action: 'lock' | 'unlock') => {
    setSelectedUser(user)
    setStatusAction(action)
    setStatusDialogOpen(true)
  }

  const confirmStatusChange = async () => {
    if (!selectedUser) return

    try {
      const newStatus: UserStatus = statusAction === 'lock' ? 'suspended' : 'active'
      const updatedUser = await updateAdminUserStatus(selectedUser.id, newStatus)
      setUsers((current) =>
        current.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      )
      setSelectedUser((current) => (current?.id === updatedUser.id ? updatedUser : current))
      toast.success(
        `Đã ${statusAction === 'lock' ? 'khóa' : 'mở khóa'} tài khoản "${updatedUser.name}"`
      )
      setStatusDialogOpen(false)
      void loadUsers()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể cập nhật trạng thái người dùng'
      )
    }
  }

  const handleChangeRole = async (user: User, newRole: UserRole) => {
    try {
      const updatedUser = await updateAdminUserRole(user.id, newRole)
      setUsers((current) =>
        current.map((item) => (item.id === updatedUser.id ? updatedUser : item))
      )
      setSelectedUser((current) => (current?.id === updatedUser.id ? updatedUser : current))
      toast.success(`Đã đổi vai trò của "${updatedUser.name}" thành "${getRoleName(newRole)}"`)
      void loadUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể đổi vai trò người dùng')
    }
  }

  const userActivity: Array<{ id: string; action: string; timestamp: string; module: string; entity: string }> = []

  return (
    <div className="space-y-6">
      <DataTableToolbar
        title="Quản lý người dùng"
        description="Quản lý tài khoản người dùng trong hệ thống"
      />

      <FilterBar
        searchPlaceholder="Tìm theo tên, email, số điện thoại..."
        searchValue={search}
        onSearchChange={handleSearchChange}
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {isLoading ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Đang tải danh sách người dùng...
        </div>
      ) : users.length === 0 ? (
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
                {users.map((user) => {
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
            totalItems={totalItems}
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
