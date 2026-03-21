import type { Dish, Shop, Order, UserProfile, ScanHistory, ListenHistory } from './types'

export const mockDishes: Dish[] = [
  {
    id: '1',
    name: 'Ốc Len Xào Dừa',
    shopName: 'Quán Ốc Cô Ba',
    shopId: 'shop-1',
    price: 85000,
    rating: 4.8,
    imageUrl: '/images/oc-len.jpg',
    isFeatured: true,
    description: 'Ốc len xào với nước cốt dừa béo ngậy, thơm lừng',
  },
  {
    id: '2',
    name: 'Nghêu Hấp Sả',
    shopName: 'Quán Ốc 68',
    shopId: 'shop-2',
    price: 75000,
    rating: 4.7,
    imageUrl: '/images/ngheu-hap.jpg',
    isFeatured: true,
    description: 'Nghêu tươi hấp với sả ớt cay nồng',
  },
  {
    id: '3',
    name: 'Sò Điệp Nướng Mỡ Hành',
    shopName: 'Hải Sản Vĩnh Khánh',
    shopId: 'shop-3',
    price: 120000,
    rating: 4.9,
    imageUrl: '/images/so-diep.jpg',
    isFeatured: true,
    description: 'Sò điệp tươi nướng với mỡ hành phi thơm',
  },
  {
    id: '4',
    name: 'Cua Rang Me',
    shopName: 'Quán Cua Biển Đông',
    shopId: 'shop-4',
    price: 350000,
    rating: 4.6,
    imageUrl: '/images/cua-rang-me.jpg',
    description: 'Cua biển rang me chua ngọt đậm đà',
  },
  {
    id: '5',
    name: 'Ốc Hương Nướng Muối Ớt',
    shopName: 'Quán Ốc Cô Ba',
    shopId: 'shop-1',
    price: 180000,
    rating: 4.8,
    imageUrl: '/images/oc-huong.jpg',
    description: 'Ốc hương nướng muối ớt cay thơm',
  },
  {
    id: '6',
    name: 'Mực Xào Tỏi',
    shopName: 'Quán Ốc 68',
    shopId: 'shop-2',
    price: 95000,
    rating: 4.5,
    imageUrl: '/images/muc-xao.jpg',
    description: 'Mực tươi xào tỏi phi thơm giòn',
  },
]

export const mockShops: Shop[] = [
  {
    id: 'shop-1',
    name: 'Quán Ốc Cô Ba',
    category: 'Ốc & Hải sản',
    distance: 50,
    isOpen: true,
    imageUrl: '/images/quan-oc-co-ba.jpg',
    address: '123 Vĩnh Khánh, Q.4',
    quickFacts: ['Mở từ 4PM', 'Có chỗ để xe', 'Nhận đặt bàn'],
    rating: 4.8,
  },
  {
    id: 'shop-2',
    name: 'Quán Ốc 68',
    category: 'Ốc & Lẩu',
    distance: 120,
    isOpen: true,
    imageUrl: '/images/quan-oc-68.jpg',
    address: '68 Vĩnh Khánh, Q.4',
    quickFacts: ['Món đặc biệt: Ốc bươu', 'Giá bình dân'],
    rating: 4.7,
  },
  {
    id: 'shop-3',
    name: 'Hải Sản Vĩnh Khánh',
    category: 'Hải sản tổng hợp',
    distance: 200,
    isOpen: true,
    imageUrl: '/images/hai-san-vk.jpg',
    address: '256 Vĩnh Khánh, Q.4',
    quickFacts: ['Hải sản tươi sống', 'Có phòng máy lạnh'],
    rating: 4.9,
  },
  {
    id: 'shop-4',
    name: 'Quán Cua Biển Đông',
    category: 'Cua & Ghẹ',
    distance: 350,
    isOpen: false,
    imageUrl: '/images/cua-bien-dong.jpg',
    address: '89 Vĩnh Khánh, Q.4',
    quickFacts: ['Chuyên cua biển', 'Không gian rộng'],
    rating: 4.6,
  },
]

export const mockOrders: Order[] = [
  {
    id: 'order-1',
    shopName: 'Quán Ốc Cô Ba',
    shopId: 'shop-1',
    datetime: '2024-01-15T18:30:00',
    total: 450000,
    status: 'completed',
    items: [
      { id: '1', name: 'Ốc Len Xào Dừa', quantity: 2, price: 85000 },
      { id: '2', name: 'Ốc Hương Nướng Muối Ớt', quantity: 1, price: 180000 },
      { id: '3', name: 'Nước ngọt', quantity: 2, price: 25000 },
    ],
  },
  {
    id: 'order-2',
    shopName: 'Quán Ốc 68',
    shopId: 'shop-2',
    datetime: '2024-01-16T19:00:00',
    total: 320000,
    status: 'processing',
    items: [
      { id: '1', name: 'Nghêu Hấp Sả', quantity: 2, price: 75000 },
      { id: '2', name: 'Mực Xào Tỏi', quantity: 1, price: 95000 },
      { id: '3', name: 'Bia Sài Gòn', quantity: 3, price: 25000 },
    ],
  },
  {
    id: 'order-3',
    shopName: 'Hải Sản Vĩnh Khánh',
    shopId: 'shop-3',
    datetime: '2024-01-10T20:00:00',
    total: 580000,
    status: 'cancelled',
    items: [
      { id: '1', name: 'Sò Điệp Nướng Mỡ Hành', quantity: 3, price: 120000 },
      { id: '2', name: 'Cua Rang Me', quantity: 1, price: 220000 },
    ],
  },
]

export const mockUser: UserProfile = {
  id: 'user-1',
  name: 'Nguyễn Văn A',
  email: 'nguyenvana@email.com',
  avatarUrl: undefined,
  preferences: {
    defaultLanguage: 'vi',
    readingSpeed: 1.0,
    autoPlayNearby: true,
  },
}

export const mockScanHistory: ScanHistory[] = [
  {
    id: 'scan-1',
    shopName: 'Quán Ốc Cô Ba',
    shopId: 'shop-1',
    scannedAt: '2024-01-15T18:00:00',
  },
  {
    id: 'scan-2',
    shopName: 'Quán Ốc 68',
    shopId: 'shop-2',
    scannedAt: '2024-01-14T19:30:00',
  },
]

export const mockListenHistory: ListenHistory[] = [
  {
    id: 'listen-1',
    title: 'Lịch sử Ốc Len Xào Dừa',
    shopName: 'Quán Ốc Cô Ba',
    listenedAt: '2024-01-15T18:35:00',
    duration: 180,
  },
  {
    id: 'listen-2',
    title: 'Câu chuyện phố ốc Vĩnh Khánh',
    shopName: 'Quán Ốc 68',
    listenedAt: '2024-01-14T19:45:00',
    duration: 240,
  },
  {
    id: 'listen-3',
    title: 'Nghệ thuật chế biến hải sản',
    shopName: 'Hải Sản Vĩnh Khánh',
    listenedAt: '2024-01-13T20:00:00',
    duration: 300,
  },
]

export const languages = [
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'th', name: 'ไทย' },
]

export const speedOptions = [
  { value: 0.9, label: '0.9x' },
  { value: 1.0, label: '1.0x' },
  { value: 1.1, label: '1.1x' },
]
