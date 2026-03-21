'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBannerProps {
  message?: string
  onRetry?: () => void
}

export function ErrorBanner({ 
  message = 'Đã có lỗi xảy ra. Vui lòng thử lại.', 
  onRetry 
}: ErrorBannerProps) {
  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-foreground">{message}</p>
        {onRetry && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRetry}
            className="mt-2 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Thử lại
          </Button>
        )}
      </div>
    </div>
  )
}
