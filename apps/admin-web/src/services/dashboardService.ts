import { apiFetch } from '@/lib/api'
import type { WeeklyVisitPoint } from '@/types'

interface WeeklyVisitsApiResponse {
  totalVisits: number
  visitsByDay: WeeklyVisitPoint[]
}

export async function fetchWeeklyVisits(): Promise<WeeklyVisitsApiResponse> {
  return apiFetch<WeeklyVisitsApiResponse>('/dashboard/weekly-visits')
}
