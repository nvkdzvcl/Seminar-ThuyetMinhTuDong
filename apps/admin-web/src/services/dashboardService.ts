import { apiFetch } from '@/lib/api'
import { fetchPois } from '@/services/poiService'
import type { Alert, ChartDataPoint, KPIStat, WeeklyVisitPoint } from '@/types'
import type { PagingResponse } from '@/lib/api'

interface WeeklyVisitsApiResponse {
  totalVisits: number
  visitsByDay: WeeklyVisitPoint[]
}

interface AdminDashboardSummaryApiResponse {
  totalUsers: number
}

interface AdminJobSummaryApiResponse {
  done: number
  failed: number
}

interface AdminJobApiModel {
  id: number
  jobCode: string
  status: 'QUEUED' | 'PROCESSING' | 'FAILED' | 'DONE' | 'CANCELED'
  errorMessage?: string | null
  createdAt: string
  endedAt?: string | null
}

interface DashboardSnapshot {
  kpiStats: KPIStat[]
  jobsChartData: ChartDataPoint[]
  alerts: Alert[]
}

const DAYS_WINDOW = 7

function toDate(input?: string | null): Date {
  if (!input) return new Date(0)
  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) return new Date(0)
  return parsed
}

function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function formatDayLabel(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}`
}

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

async function fetchAdminJobsPage(params: {
  status?: AdminJobApiModel['status']
  page: number
  size: number
}): Promise<PagingResponse<AdminJobApiModel>> {
  const query = new URLSearchParams()
  query.set('page', String(params.page))
  query.set('size', String(params.size))
  if (params.status) {
    query.set('status', params.status)
  }
  return apiFetch<PagingResponse<AdminJobApiModel>>(`/admin/jobs?${query.toString()}`)
}

async function fetchRecentJobsByStatus(
  status: AdminJobApiModel['status'],
  windowStart: Date
): Promise<AdminJobApiModel[]> {
  const size = 100
  let page = 1
  const collected: AdminJobApiModel[] = []

  while (true) {
    const result = await fetchAdminJobsPage({ status, page, size })
    if (result.items.length === 0) break

    result.items.forEach((item) => {
      const createdAt = toDate(item.createdAt)
      if (createdAt >= windowStart) {
        collected.push(item)
      }
    })

    const oldestInPage = toDate(result.items[result.items.length - 1]?.createdAt)
    if (oldestInPage < windowStart || page >= (result.totalPages || 1)) {
      break
    }
    page += 1
  }

  return collected
}

function buildJobsChartData(
  doneJobs: AdminJobApiModel[],
  failedJobs: AdminJobApiModel[],
  windowStart: Date
): ChartDataPoint[] {
  const byDay = new Map<string, { date: string; success: number; failed: number }>()

  for (let i = 0; i < DAYS_WINDOW; i += 1) {
    const day = new Date(windowStart)
    day.setDate(windowStart.getDate() + i)
    byDay.set(toDayKey(day), {
      date: formatDayLabel(day),
      success: 0,
      failed: 0,
    })
  }

  doneJobs.forEach((job) => {
    const key = toDayKey(startOfDay(toDate(job.createdAt)))
    const day = byDay.get(key)
    if (day) day.success += 1
  })

  failedJobs.forEach((job) => {
    const key = toDayKey(startOfDay(toDate(job.createdAt)))
    const day = byDay.get(key)
    if (day) day.failed += 1
  })

  return Array.from(byDay.values()).map((item) => ({
    date: item.date,
    success: item.success,
    failed: item.failed,
    jobs: item.success + item.failed,
  }))
}

function buildAlerts(
  flaggedPois: Awaited<ReturnType<typeof fetchPois>>['items'],
  failedJobs: AdminJobApiModel[]
): Alert[] {
  const poiAlerts: Alert[] = flaggedPois.map((poi) => ({
    id: `poi-${poi.id}`,
    type: 'flagged_poi',
    title: 'POI bị gắn cờ',
    description:
      poi.riskScore != null
        ? `${poi.name} có điểm rủi ro ${poi.riskScore}/100`
        : `${poi.name} đang ở trạng thái gắn cờ`,
    timestamp: poi.updatedAt || poi.createdAt,
    severity: 'warning',
  }))

  const jobAlerts: Alert[] = failedJobs.map((job) => ({
    id: `job-${job.id}`,
    type: 'failed_job',
    title: 'Job thất bại',
    description: job.errorMessage
      ? `Job ${job.jobCode} thất bại: ${job.errorMessage}`
      : `Job ${job.jobCode} thất bại và cần retry`,
    timestamp: job.endedAt || job.createdAt,
    severity: 'error',
  }))

  return [...poiAlerts, ...jobAlerts]
    .sort((a, b) => toDate(b.timestamp).getTime() - toDate(a.timestamp).getTime())
    .slice(0, 6)
}

export async function fetchWeeklyVisits(): Promise<WeeklyVisitsApiResponse> {
  return apiFetch<WeeklyVisitsApiResponse>('/admin/dashboard/weekly-visits')
}

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const today = startOfDay(new Date())
  const windowStart = new Date(today)
  windowStart.setDate(today.getDate() - (DAYS_WINDOW - 1))

  const [
    summary,
    jobsSummary,
    publishedPoisPage,
    doneJobs,
    failedJobs,
    flaggedPoisPage,
    failedJobsForAlerts,
  ] = await Promise.all([
    apiFetch<AdminDashboardSummaryApiResponse>('/admin/dashboard/summary'),
    apiFetch<AdminJobSummaryApiResponse>('/admin/jobs/summary'),
    fetchPois({ page: 1, size: 1, status: 'published' }),
    fetchRecentJobsByStatus('DONE', windowStart),
    fetchRecentJobsByStatus('FAILED', windowStart),
    fetchPois({ page: 1, size: 3, status: 'flagged' }),
    fetchAdminJobsPage({ status: 'FAILED', page: 1, size: 3 }),
  ])

  const failedJobsToday = failedJobs.filter(
    (job) => startOfDay(toDate(job.createdAt)).getTime() === today.getTime()
  ).length

  const totalSettledJobs = jobsSummary.done + jobsSummary.failed
  const publishSuccessRate =
    totalSettledJobs > 0 ? `${((jobsSummary.done / totalSettledJobs) * 100).toFixed(1)}%` : '0.0%'

  const kpiStats: KPIStat[] = [
    {
      label: 'Tổng người dùng',
      value: summary.totalUsers,
    },
    {
      label: 'POI đang public',
      value: publishedPoisPage.totalItems,
    },
    {
      label: 'Job lỗi hôm nay',
      value: failedJobsToday,
    },
    {
      label: 'Tỷ lệ publish thành công',
      value: publishSuccessRate,
    },
  ]

  const jobsChartData = buildJobsChartData(doneJobs, failedJobs, windowStart)
  const alerts = buildAlerts(flaggedPoisPage.items, failedJobsForAlerts.items)

  return {
    kpiStats,
    jobsChartData,
    alerts,
  }
}
