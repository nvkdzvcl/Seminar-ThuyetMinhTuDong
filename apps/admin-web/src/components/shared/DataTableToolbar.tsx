import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Download, RefreshCw } from 'lucide-react'

interface DataTableToolbarProps {
  title: string
  description?: string
  onAdd?: () => void
  addLabel?: string
  onExport?: () => void
  onRefresh?: () => void
  isLoading?: boolean
  children?: ReactNode
}

export function DataTableToolbar({
  title,
  description,
  onAdd,
  addLabel = 'Thêm mới',
  onExport,
  onRefresh,
  isLoading,
  children,
}: DataTableToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Xuất file
          </Button>
        )}
        {onAdd && (
          <Button size="sm" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            {addLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
