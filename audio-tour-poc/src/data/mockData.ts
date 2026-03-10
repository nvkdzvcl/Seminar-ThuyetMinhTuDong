import type { POI, Tour, ListenEvent, AnalyticsSummary, DailyListenData, TopPOI } from '../types';

// Mock POIs - Khu phố ẩm thực (centered around Ben Thanh Market area, HCMC)
export const MOCK_POIS: POI[] = [
  {
    id: 'poi-1',
    name: 'Bánh Mì Huỳnh Hoa',
    category: 'food',
    lat: 10.7721,
    lng: 106.6943,
    radius: 30,
    audioUrl: '/audio/banh-mi.mp3',
    textToSpeech: 'Chào mừng bạn đến Bánh Mì Huỳnh Hoa, một trong những tiệm bánh mì nổi tiếng nhất Sài Gòn. Địa chỉ tại 26 Lê Thị Riêng, nơi đây nổi tiếng với bánh mì thịt nguội dồi dào và hương vị đậm đà.',
    createdAt: '2025-07-01T08:00:00Z',
    updatedAt: '2025-07-01T08:00:00Z',
  },
  {
    id: 'poi-2',
    name: 'Phở Lệ',
    category: 'food',
    lat: 10.7735,
    lng: 106.6960,
    radius: 25,
    textToSpeech: 'Đây là Phở Lệ, quán phở có truyền thống lâu đời tại khu phố ẩm thực. Phở ở đây được nấu từ nước dùng hầm xương bò trong nhiều giờ, tạo nên hương vị đậm đà.',
    createdAt: '2025-07-01T09:00:00Z',
    updatedAt: '2025-07-01T09:00:00Z',
  },
  {
    id: 'poi-3',
    name: 'Cà Phê Trứng',
    category: 'drink',
    lat: 10.7715,
    lng: 106.6955,
    radius: 20,
    textToSpeech: 'Cà phê trứng là một đặc sản của Việt Nam. Tại đây, bạn sẽ được thưởng thức cà phê với lớp kem trứng béo ngậy trên mặt.',
    createdAt: '2025-07-02T10:00:00Z',
    updatedAt: '2025-07-02T10:00:00Z',
  },
  {
    id: 'poi-4',
    name: 'Chè Ba Màu',
    category: 'snack',
    lat: 10.7728,
    lng: 106.6938,
    radius: 20,
    textToSpeech: 'Chè ba màu là món chè truyền thống với ba tầng màu sắc đẹp mắt: đậu đỏ, đậu xanh, và rau câu. Món ăn giải nhiệt tuyệt vời cho những ngày nóng.',
    createdAt: '2025-07-03T11:00:00Z',
    updatedAt: '2025-07-03T11:00:00Z',
  },
  {
    id: 'poi-5',
    name: 'Nhà Vệ Sinh Công Cộng',
    category: 'wc',
    lat: 10.7740,
    lng: 106.6950,
    radius: 15,
    createdAt: '2025-07-04T12:00:00Z',
    updatedAt: '2025-07-04T12:00:00Z',
  },
  {
    id: 'poi-6',
    name: 'Bãi Giữ Xe',
    category: 'parking',
    lat: 10.7710,
    lng: 106.6935,
    radius: 40,
    createdAt: '2025-07-04T12:30:00Z',
    updatedAt: '2025-07-04T12:30:00Z',
  },
];

export const MOCK_TOURS: Tour[] = [
  {
    id: 'tour-1',
    name: 'Tour Ẩm Thực Đường Phố',
    poiIds: ['poi-1', 'poi-2', 'poi-3', 'poi-4', 'poi-5', 'poi-6'],
    qrToken: 'abc123-token-xyz',
    qrImageUrl: '',
    createdAt: '2025-07-05T08:00:00Z',
    isActive: true,
  },
];

export const MOCK_LISTEN_EVENTS: ListenEvent[] = [
  { id: 'le-1', poiId: 'poi-1', tourId: 'tour-1', sessionToken: 's1', durationMs: 45000, completed: true, timestamp: '2025-07-10T09:00:00Z', lat: 10.7721, lng: 106.6943 },
  { id: 'le-2', poiId: 'poi-2', tourId: 'tour-1', sessionToken: 's1', durationMs: 30000, completed: true, timestamp: '2025-07-10T09:15:00Z', lat: 10.7735, lng: 106.6960 },
  { id: 'le-3', poiId: 'poi-3', tourId: 'tour-1', sessionToken: 's2', durationMs: 15000, completed: false, timestamp: '2025-07-10T10:00:00Z', lat: 10.7715, lng: 106.6955 },
  { id: 'le-4', poiId: 'poi-1', tourId: 'tour-1', sessionToken: 's3', durationMs: 50000, completed: true, timestamp: '2025-07-11T09:00:00Z', lat: 10.7721, lng: 106.6943 },
  { id: 'le-5', poiId: 'poi-4', tourId: 'tour-1', sessionToken: 's3', durationMs: 20000, completed: true, timestamp: '2025-07-11T09:30:00Z', lat: 10.7728, lng: 106.6938 },
  { id: 'le-6', poiId: 'poi-2', tourId: 'tour-1', sessionToken: 's4', durationMs: 35000, completed: true, timestamp: '2025-07-12T14:00:00Z', lat: 10.7735, lng: 106.6960 },
  { id: 'le-7', poiId: 'poi-3', tourId: 'tour-1', sessionToken: 's5', durationMs: 12000, completed: false, timestamp: '2025-07-12T15:00:00Z', lat: 10.7715, lng: 106.6955 },
  { id: 'le-8', poiId: 'poi-1', tourId: 'tour-1', sessionToken: 's6', durationMs: 48000, completed: true, timestamp: '2025-07-13T10:00:00Z', lat: 10.7721, lng: 106.6943 },
];

export const MOCK_SUMMARY: AnalyticsSummary = {
  totalListens: 8,
  avgDurationMs: 31875,
  uniqueSessions: 6,
  completionRate: 62.5,
};

export const MOCK_DAILY_DATA: DailyListenData[] = [
  { date: '2025-07-10', listens: 3 },
  { date: '2025-07-11', listens: 2 },
  { date: '2025-07-12', listens: 2 },
  { date: '2025-07-13', listens: 1 },
];

export const MOCK_TOP_POIS: TopPOI[] = [
  { poiId: 'poi-1', poiName: 'Bánh Mì Huỳnh Hoa', category: 'food', totalListens: 3, avgDurationMs: 47667 },
  { poiId: 'poi-2', poiName: 'Phở Lệ', category: 'food', totalListens: 2, avgDurationMs: 32500 },
  { poiId: 'poi-3', poiName: 'Cà Phê Trứng', category: 'drink', totalListens: 2, avgDurationMs: 13500 },
  { poiId: 'poi-4', poiName: 'Chè Ba Màu', category: 'snack', totalListens: 1, avgDurationMs: 20000 },
];

// Map center for HCMC food street area
export const MAP_CENTER = { lat: 10.7725, lng: 106.6948 };
export const MAP_ZOOM = 17;