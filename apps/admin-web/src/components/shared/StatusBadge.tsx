import { cn } from '@/lib/utils'
import { getStatusName } from '@/lib/utils'

type StatusType =
  | 'active'
  | 'suspended'
  | 'draft'
  | 'published'
  | 'flagged'
  | 'hidden'
  | 'queued'
  | 'processing'
  | 'failed'
  | 'done'
  | 'canceled'

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

const statusStyles: Record<StatusType, string> = {
  // User statuses
  active: 'bg-success/10 text-success border-success/20',
  suspended: 'bg-destructive/10 text-destructive border-destructive/20',
  // POI statuses
  draft: 'bg-muted text-muted-foreground border-border',
  published: 'bg-success/10 text-success border-success/20',
  flagged: 'bg-warning/10 text-warning-foreground border-warning/20',
  hidden: 'bg-destructive/10 text-destructive border-destructive/20',
  // Job statuses
  queued: 'bg-info/10 text-info border-info/20',
  processing: 'bg-info/10 text-info border-info/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
  done: 'bg-success/10 text-success border-success/20',
  canceled: 'bg-muted text-muted-foreground border-border',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {getStatusName(status)}
    </span>
  )
}
