import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuditDiffCellProps {
  before?: string
  after?: string
  className?: string
}

export function AuditDiffCell({ before, after, className }: AuditDiffCellProps) {
  if (!before && !after) {
    return <span className="text-muted-foreground">-</span>
  }

  const truncate = (text: string, maxLength: number = 20) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      {before && (
        <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-destructive line-through">
          {truncate(before)}
        </span>
      )}
      {before && after && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
      {after && (
        <span className="rounded bg-success/10 px-1.5 py-0.5 text-success">
          {truncate(after)}
        </span>
      )}
    </div>
  )
}
