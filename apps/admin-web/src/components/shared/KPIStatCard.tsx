import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface KPIStatCardProps {
  label: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon?: LucideIcon
  className?: string
}

export function KPIStatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  className,
}: KPIStatCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span className="text-2xl font-bold tracking-tight">{value}</span>
            {change !== undefined && (
              <div className="flex items-center gap-1 text-xs">
                {changeType === 'increase' && (
                  <>
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-success">+{change}%</span>
                  </>
                )}
                {changeType === 'decrease' && (
                  <>
                    <TrendingDown className="h-3 w-3 text-destructive" />
                    <span className="text-destructive">-{change}%</span>
                  </>
                )}
                {changeType === 'neutral' && (
                  <>
                    <Minus className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{change}%</span>
                  </>
                )}
                <span className="text-muted-foreground">so với tuần trước</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
