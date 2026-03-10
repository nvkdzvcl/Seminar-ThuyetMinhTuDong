export interface POI {
  id: string;
  name: string;
  category: 'food' | 'drink' | 'snack' | 'wc' | 'parking';
  lat: number;
  lng: number;
  radius: number;
  audioUrl?: string;
  textToSpeech?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tour {
  id: string;
  name: string;
  poiIds: string[];
  qrToken: string;
  qrImageUrl: string;
  createdAt: string;
  isActive: boolean;
}

export interface ListenEvent {
  id: string;
  poiId: string;
  tourId: string;
  sessionToken: string;
  durationMs: number;
  completed: boolean;
  timestamp: string;
  lat: number;
  lng: number;
}

export interface AdminUser {
  id: string;
  username: string;
  lastLoginAt: string;
}

export interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface AnalyticsSummary {
  totalListens: number;
  avgDurationMs: number;
  uniqueSessions: number;
  completionRate: number;
}

export interface DailyListenData {
  date: string;
  listens: number;
}

export interface TopPOI {
  poiId: string;
  poiName: string;
  category: string;
  totalListens: number;
  avgDurationMs: number;
}

export type TimeRange = 'day' | 'week' | 'month' | 'all';

export const MAIN_CATEGORIES = ['food', 'drink', 'snack'] as const;
export const SUB_CATEGORIES = ['wc', 'parking'] as const;

export function isMainCategory(cat: string): boolean {
  return (MAIN_CATEGORIES as readonly string[]).includes(cat);
}
