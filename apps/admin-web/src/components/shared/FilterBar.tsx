import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterConfig {
  key: string
  label: string
  options: FilterOption[]
  value?: string
}

interface FilterBarProps {
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void
  filters?: FilterConfig[]
  onFilterChange?: (key: string, value: string) => void
  onClearFilters?: () => void
  hasActiveFilters?: boolean
}

export function FilterBar({
  searchPlaceholder = 'Tìm kiếm...',
  searchValue,
  onSearchChange,
  filters = [],
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Search Input */}
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={filter.value || 'all'}
            onValueChange={(value) => onFilterChange?.(filter.key, value)}
          >
            <SelectTrigger className="h-9 w-auto min-w-[140px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả {filter.label.toLowerCase()}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-9">
            <X className="mr-1 h-4 w-4" />
            Xóa bộ lọc
          </Button>
        )}
      </div>
    </div>
  )
}
