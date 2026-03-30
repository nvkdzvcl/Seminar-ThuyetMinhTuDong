import { apiFetch } from "@/lib/api"

export interface OwnerDailyMetric {
  date: string
  orders: number
  revenue: number
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
  totalOrders7Days: number
  totalRevenue7Days: number
  avgDailyOrders: number
  uniqueCustomers7Days: number
  growthPercent: number
  dailyMetrics: OwnerDailyMetric[]
  languageMetrics: OwnerLanguageMetric[]
  topDishMetrics: OwnerTopDishMetric[]
}

export function getOwnerInsights(): Promise<OwnerInsights> {
  return apiFetch<OwnerInsights>("/dashboard/owner-insights")
}

