import { apiFetch } from "@/lib/api"

export interface OwnerRecentActivity {
  type: string
  title: string
  subtitle: string
  occurredAt: string
}

export interface OwnerHomeStats {
  shopId: number
  qrScansToday: number
  audioPlaysToday: number
  topLanguage: string
  topDish: string
  recentActivities: OwnerRecentActivity[]
}

export function getOwnerHomeStats(): Promise<OwnerHomeStats> {
  return apiFetch<OwnerHomeStats>("/dashboard/owner-home")
}
