import { apiFetch } from "@/lib/api"

export interface OwnerDailyMetric {
  date: string
  visits: number
  audioCompletions: number
}

export interface OwnerLanguageMetric {
  language: string
  count: number
}

export interface OwnerTopDishMetric {
  dishName: string
  quantity: number
}

export interface OwnerInsights {
  shopId: number
  totalVisits7Days: number
  avgDailyVisits: number
  totalAudioCompletions7Days: number
  uniqueSessions7Days: number
  growthPercent: number
  dailyMetrics: OwnerDailyMetric[]
  languageMetrics: OwnerLanguageMetric[]
  topDishMetrics: OwnerTopDishMetric[]
}

export function getOwnerInsights(): Promise<OwnerInsights> {
  return apiFetch<OwnerInsights>("/dashboard/owner-insights")
}
