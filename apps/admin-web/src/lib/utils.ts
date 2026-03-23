import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  return formatDate(dateString)
}

export function getRoleName(role: string): string {
  const roleNames: Record<string, string> = {
    super_admin: 'Super Admin',
    customer: 'Khách hàng',
    store_owner: 'Chủ cửa hàng',
  }
  return roleNames[role] || role
}

export function getStatusName(status: string): string {
  const statusNames: Record<string, string> = {
    active: 'Hoạt động',
    suspended: 'Tạm ngưng',
    draft: 'Nháp',
    published: 'Công khai',
    flagged: 'Gắn cờ',
    hidden: 'Ẩn',
    queued: 'Đang chờ',
    processing: 'Đang xử lý',
    failed: 'Thất bại',
    done: 'Hoàn thành',
  }
  return statusNames[status] || status
}

export function getJobTypeName(type: string): string {
  const typeNames: Record<string, string> = {
    audio_generation: 'Tạo audio',
    content_moderation: 'Kiểm duyệt nội dung',
    image_processing: 'Xử lý ảnh',
    data_sync: 'Đồng bộ dữ liệu',
  }
  return typeNames[type] || type
}

export function getModuleName(module: string): string {
  const moduleNames: Record<string, string> = {
    poi: 'POI',
    user: 'Người dùng',
    job: 'Hàng đợi',
    system: 'Hệ thống',
    settings: 'Cài đặt',
  }
  return moduleNames[module] || module
}

export function getActionName(action: string): string {
  const actionNames: Record<string, string> = {
    create: 'Tạo mới',
    update: 'Cập nhật',
    delete: 'Xóa',
    status_change: 'Đổi trạng thái',
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
  }
  return actionNames[action] || action
}
