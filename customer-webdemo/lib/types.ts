export interface Dish {
  id: string
  name: string
  shopName: string
  shopId: string
  price: number
  rating: number
  imageUrl: string
  isFeatured?: boolean
  description?: string
}

export interface Shop {
  id: string
  name: string
  category: string
  distance: number
  isOpen: boolean
  imageUrl: string
  address: string
  quickFacts?: string[]
  rating?: number
}

export interface Order {
  id: string
  shopName: string
  shopId: string
  datetime: string
  total: number
  status: 'processing' | 'completed' | 'cancelled'
  items: OrderItem[]
}

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatarUrl?: string
  preferences: UserPreferences
}

export interface UserPreferences {
  defaultLanguage: string
  readingSpeed: number
  autoPlayNearby: boolean
}

export interface AudioState {
  isPlaying: boolean
  currentTitle: string
  progress: number
  status: 'idle' | 'translating' | 'generating' | 'playing'
  language: string
  speed: number
}

export interface ConnectionStatus {
  status: 'connected' | 'connecting' | 'disconnected'
}

export interface ScanHistory {
  id: string
  shopName: string
  shopId: string
  scannedAt: string
}

export interface ListenHistory {
  id: string
  title: string
  shopName: string
  listenedAt: string
  duration: number
}

export type TabId = 'dishes' | 'shops' | 'nearby' | 'scan' | 'orders' | 'profile'
