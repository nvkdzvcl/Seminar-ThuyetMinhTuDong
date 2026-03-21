'use client'

import { useState, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { AudioPlayer } from '@/components/layout/audio-player'
import { DishesPage } from '@/components/pages/dishes-page'
import { ShopsPage } from '@/components/pages/shops-page'
import { NearbyPage } from '@/components/pages/nearby-page'
import { ScanPage } from '@/components/pages/scan-page'
import { OrdersPage } from '@/components/pages/orders-page'
import { ProfilePage } from '@/components/pages/profile-page'
import type { TabId, AudioState } from '@/lib/types'

const pageConfig: Record<TabId, { title: string; showLocation: boolean }> = {
  dishes: { title: 'Món ăn', showLocation: true },
  shops: { title: 'Quán ăn', showLocation: true },
  nearby: { title: 'Gần tôi', showLocation: false },
  scan: { title: 'Quét QR', showLocation: false },
  orders: { title: 'Đơn hàng', showLocation: false },
  profile: { title: 'Hồ sơ', showLocation: false },
}

export default function FoodTourApp() {
  const [activeTab, setActiveTab] = useState<TabId>('dishes')
  const [audioPlayerExpanded, setAudioPlayerExpanded] = useState(false)
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentTitle: '',
    progress: 0,
    status: 'idle',
    language: 'vi',
    speed: 1.0,
  })

  const handlePlayAudio = useCallback((title: string) => {
    // Simulate audio generation and playback
    setAudioState(prev => ({
      ...prev,
      currentTitle: title,
      status: 'translating',
      progress: 0,
      isPlaying: false,
    }))

    // Simulate translation step
    setTimeout(() => {
      setAudioState(prev => ({
        ...prev,
        status: 'generating',
      }))
    }, 1000)

    // Simulate audio generation complete
    setTimeout(() => {
      setAudioState(prev => ({
        ...prev,
        status: 'playing',
        isPlaying: true,
      }))
      
      // Simulate progress
      let progress = 0
      const interval = setInterval(() => {
        progress += 1
        if (progress >= 100) {
          clearInterval(interval)
          setAudioState(prev => ({
            ...prev,
            isPlaying: false,
            status: 'idle',
            progress: 100,
          }))
        } else {
          setAudioState(prev => ({
            ...prev,
            progress,
          }))
        }
      }, 300)
    }, 2500)
  }, [])

  const handlePlayPause = useCallback(() => {
    setAudioState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying,
      status: prev.isPlaying ? 'idle' : 'playing',
    }))
  }, [])

  const handleProgressChange = useCallback((value: number[]) => {
    setAudioState(prev => ({
      ...prev,
      progress: value[0],
    }))
  }, [])

  const handleLanguageChange = useCallback((language: string) => {
    setAudioState(prev => ({
      ...prev,
      language,
    }))
    // Trigger re-translation if audio is loaded
    if (audioState.currentTitle) {
      handlePlayAudio(audioState.currentTitle)
    }
  }, [audioState.currentTitle, handlePlayAudio])

  const handleSpeedChange = useCallback((speed: string) => {
    setAudioState(prev => ({
      ...prev,
      speed: parseFloat(speed),
    }))
  }, [])

  const handleScanQR = useCallback(() => {
    setActiveTab('scan')
  }, [])

  const currentPage = pageConfig[activeTab]

  const renderPage = () => {
    switch (activeTab) {
      case 'dishes':
        return <DishesPage onPlayAudio={handlePlayAudio} />
      case 'shops':
        return <ShopsPage onPlayAudio={handlePlayAudio} onScanQR={handleScanQR} />
      case 'nearby':
        return <NearbyPage onPlayAudio={handlePlayAudio} />
      case 'scan':
        return <ScanPage />
      case 'orders':
        return <OrdersPage onPlayAudio={handlePlayAudio} />
      case 'profile':
        return <ProfilePage onPlayAudio={handlePlayAudio} />
      default:
        return <DishesPage onPlayAudio={handlePlayAudio} />
    }
  }

  const hasAudio = audioState.currentTitle !== ''

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
      {/* Sticky Header */}
      <Header 
        title={currentPage.title} 
        showLocation={currentPage.showLocation} 
      />

      {/* Main Content */}
      <main 
        className="flex-1 overflow-y-auto"
        style={{ 
          paddingBottom: hasAudio ? '8.5rem' : '4.5rem',
        }}
      >
        {renderPage()}
      </main>

      {/* Audio Player */}
      <AudioPlayer
        audioState={audioState}
        onPlayPause={handlePlayPause}
        onProgressChange={handleProgressChange}
        onLanguageChange={handleLanguageChange}
        onSpeedChange={handleSpeedChange}
        isExpanded={audioPlayerExpanded}
        onToggleExpand={() => setAudioPlayerExpanded(!audioPlayerExpanded)}
      />

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
