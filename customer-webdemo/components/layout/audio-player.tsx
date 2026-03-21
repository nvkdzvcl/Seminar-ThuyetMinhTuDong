'use client'

import { Play, Pause, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AudioState } from '@/lib/types'
import { languages, speedOptions } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  audioState: AudioState
  onPlayPause: () => void
  onProgressChange: (value: number[]) => void
  onLanguageChange: (language: string) => void
  onSpeedChange: (speed: string) => void
  isExpanded: boolean
  onToggleExpand: () => void
}

export function AudioPlayer({
  audioState,
  onPlayPause,
  onProgressChange,
  onLanguageChange,
  onSpeedChange,
  isExpanded,
  onToggleExpand,
}: AudioPlayerProps) {
  const { isPlaying, currentTitle, progress, status, language, speed } = audioState

  if (status === 'idle' && !currentTitle) {
    return null
  }

  const statusLabels: Record<AudioState['status'], string> = {
    idle: '',
    translating: 'Đang dịch...',
    generating: 'Đang tạo audio...',
    playing: 'Đang phát',
  }

  const statusColors: Record<AudioState['status'], string> = {
    idle: '',
    translating: 'bg-warning text-warning-foreground',
    generating: 'bg-accent text-accent-foreground',
    playing: 'bg-success text-success-foreground',
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 bg-card border-t border-border shadow-lg">
      {/* Collapsed View */}
      <div 
        className="flex items-center gap-3 px-3 py-2 cursor-pointer"
        onClick={onToggleExpand}
      >
        <Button
          size="icon"
          variant="default"
          className="h-10 w-10 rounded-full shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onPlayPause()
          }}
          disabled={status === 'translating' || status === 'generating'}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {currentTitle || 'Không có audio'}
            </p>
            {status !== 'idle' && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0',
                statusColors[status]
              )}>
                {statusLabels[status]}
              </span>
            )}
          </div>
          <div className="mt-1">
            <Slider
              value={[progress]}
              max={100}
              step={1}
              onValueChange={onProgressChange}
              className="h-1"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <ChevronDown className={cn(
          'h-5 w-5 text-muted-foreground shrink-0 transition-transform',
          isExpanded && 'rotate-180'
        )} />
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="px-4 pb-3 pt-1 border-t border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Ngôn ngữ</label>
              <Select value={language} onValueChange={onLanguageChange}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <label className="text-xs text-muted-foreground mb-1 block">Tốc độ</label>
              <Select value={speed.toString()} onValueChange={onSpeedChange}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {speedOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
