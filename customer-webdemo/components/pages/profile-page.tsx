'use client'

import { useState } from 'react'
import { User, Globe, Gauge, Volume2, History, Key, LogOut, ChevronRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-states'
import { mockUser, mockListenHistory, languages, speedOptions } from '@/lib/mock-data'
import type { UserPreferences } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ProfilePageProps {
  onPlayAudio: (title: string) => void
}

export function ProfilePage({ onPlayAudio }: ProfilePageProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(mockUser.preferences)

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const handlePlayHistory = (title: string) => {
    onPlayAudio(title)
  }

  return (
    <div className="pb-4">
      {/* User Summary Card */}
      <div className="mx-4 mt-4 bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            {mockUser.avatarUrl ? (
              <img 
                src={mockUser.avatarUrl} 
                alt={mockUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground text-lg truncate">
              {mockUser.name}
            </h2>
            <p className="text-sm text-muted-foreground truncate">
              {mockUser.email}
            </p>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <section className="mt-6">
        <h3 className="px-4 text-sm font-medium text-muted-foreground mb-3">Cài đặt</h3>
        
        <div className="mx-4 bg-card rounded-xl border border-border divide-y divide-border">
          {/* Default Language */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Ngôn ngữ mặc định</p>
                <p className="text-xs text-muted-foreground">Ngôn ngữ thuyết minh</p>
              </div>
            </div>
            <Select 
              value={preferences.defaultLanguage} 
              onValueChange={(value) => updatePreference('defaultLanguage', value)}
            >
              <SelectTrigger className="w-28 h-9">
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

          {/* Reading Speed */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Gauge className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Tốc độ đọc</p>
                <p className="text-xs text-muted-foreground">Điều chỉnh tốc độ phát</p>
              </div>
            </div>
            <Select 
              value={preferences.readingSpeed.toString()} 
              onValueChange={(value) => updatePreference('readingSpeed', parseFloat(value))}
            >
              <SelectTrigger className="w-20 h-9">
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

          {/* Auto Play Toggle */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <Volume2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Tự phát khi tới gần quán</p>
                <p className="text-xs text-muted-foreground">Phát tự động thuyết minh</p>
              </div>
            </div>
            <Switch 
              checked={preferences.autoPlayNearby}
              onCheckedChange={(checked) => updatePreference('autoPlayNearby', checked)}
            />
          </div>
        </div>
      </section>

      {/* Listen History Section */}
      <section className="mt-6">
        <div className="flex items-center gap-2 px-4 mb-3">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Lịch sử đã nghe</h3>
        </div>
        
        {mockListenHistory.length === 0 ? (
          <div className="mx-4">
            <EmptyState type="history" />
          </div>
        ) : (
          <div className="mx-4 bg-card rounded-xl border border-border divide-y divide-border">
            {mockListenHistory.map((item) => (
              <button
                key={item.id}
                className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left"
                onClick={() => handlePlayHistory(item.title)}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Play className="h-4 w-4 text-primary ml-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{item.shopName}</span>
                    <span>-</span>
                    <span>{formatDuration(item.duration)}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(item.listenedAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Account Actions Section */}
      <section className="mt-6">
        <h3 className="px-4 text-sm font-medium text-muted-foreground mb-3">Tài khoản</h3>
        
        <div className="mx-4 bg-card rounded-xl border border-border divide-y divide-border">
          <button className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Key className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="flex-1 text-sm font-medium text-foreground">Đổi mật khẩu</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          
          <button className="w-full flex items-center gap-3 p-4 hover:bg-destructive/5 transition-colors text-left">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <LogOut className="h-5 w-5 text-destructive" />
            </div>
            <span className="flex-1 text-sm font-medium text-destructive">Đăng xuất</span>
            <ChevronRight className="h-4 w-4 text-destructive/50" />
          </button>
        </div>
      </section>
    </div>
  )
}
