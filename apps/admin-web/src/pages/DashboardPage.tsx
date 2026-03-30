import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  MapPin,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Flag,
  Clock,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { KPIStatCard } from '@/components/shared/KPIStatCard'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { fetchDashboardSnapshot, fetchWeeklyVisits } from '@/services/dashboardService'
import type { Alert, ChartDataPoint, KPIStat, WeeklyVisitPoint } from '@/types'

export function DashboardPage() {
  const navigate = useNavigate()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [kpiStats, setKpiStats] = useState<KPIStat[]>([])
  const [jobsChartData, setJobsChartData] = useState<ChartDataPoint[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [weeklyVisits, setWeeklyVisits] = useState<WeeklyVisitPoint[]>([])
  const [totalWeeklyVisits, setTotalWeeklyVisits] = useState(0)

  const handleRefresh = () => {
    setIsRefreshing(true)
    void loadDashboardData().finally(() => {
      setTimeout(() => setIsRefreshing(false), 500)
    })
  }

  const loadDashboardData = async () => {
    try {
      const [snapshot, weekly] = await Promise.all([
        fetchDashboardSnapshot(),
        fetchWeeklyVisits(),
      ])

      setKpiStats(snapshot.kpiStats)
      setJobsChartData(snapshot.jobsChartData)
      setAlerts(snapshot.alerts)
      setWeeklyVisits(weekly.visitsByDay)
      setTotalWeeklyVisits(weekly.totalVisits)
    } catch {
      setKpiStats([])
      setJobsChartData([])
      setAlerts([])
      setWeeklyVisits([])
      setTotalWeeklyVisits(0)
    }
  }

  useEffect(() => {
    void loadDashboardData()
  }, [])

  const kpiIcons = [Users, MapPin, AlertTriangle, CheckCircle]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
          <p className="text-sm text-muted-foreground">
            Xin chào! Đây là tổng quan hoạt động hệ thống hôm nay.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
            Làm mới
          </Button>
          <Button size="sm" onClick={() => navigate('/poi')}>
            <MapPin className="mr-2 h-4 w-4" />
            Quản lý POI
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiStats.map((stat, index) => (
          <KPIStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={kpiIcons[index]}
          />
        ))}
        {kpiStats.length === 0 && (
          <div className="col-span-full rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            Chưa có dữ liệu KPI.
          </div>
        )}
      </div>

      {/* Charts and Weekly Visits */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Jobs Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Job theo ngày (7 ngày gần đây)</CardTitle>
            <CardDescription>Thống kê số lượng job xử lý theo trạng thái</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jobsChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'currentColor' }} />
                <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Bar
                  dataKey="success"
                  name="Thành công"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="failed"
                  name="Thất bại"
                  fill="hsl(var(--chart-4))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            {jobsChartData.length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                Chưa có dữ liệu job trong 7 ngày gần đây.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Weekly Visits */}
        <Card>
          <CardHeader>
            <CardTitle>Lượt ghé trong tuần</CardTitle>
            <CardDescription>Tổng lượt ghé 7 ngày: {totalWeeklyVisits}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {weeklyVisits.map((item) => (
              <div key={item.date} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.date}</span>
                  <span className="text-muted-foreground">{item.visits} lượt</span>
                </div>
                <Progress value={totalWeeklyVisits ? (item.visits / totalWeeklyVisits) * 100 : 0} className="h-2" />
              </div>
            ))}
            {weeklyVisits.length === 0 && (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu lượt ghé trong tuần.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Cảnh báo và thông báo
          </CardTitle>
          <CardDescription>POI bị gắn cờ và job cần xử lý</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-4 rounded-lg border p-4',
                  alert.severity === 'error' ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5'
                )}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    alert.severity === 'error' ? 'bg-destructive/10' : 'bg-warning/10'
                  )}
                >
                  {alert.type === 'flagged_poi' ? (
                    <Flag className={cn('h-4 w-4', alert.severity === 'error' ? 'text-destructive' : 'text-warning')} />
                  ) : (
                    <AlertTriangle className={cn('h-4 w-4', alert.severity === 'error' ? 'text-destructive' : 'text-warning')} />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(alert.timestamp)}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {alert.type === 'flagged_poi' ? 'Xem POI' : 'Retry'}
                </Button>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Không có cảnh báo nào tại thời điểm hiện tại.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hành động nhanh</CardTitle>
          <CardDescription>Các tác vụ thường dùng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/poi')}>
              <MapPin className="mr-2 h-4 w-4" />
              Quản lý POI
            </Button>
            <Button variant="outline" onClick={() => navigate('/users')}>
              <Users className="mr-2 h-4 w-4" />
              Quản lý người dùng
            </Button>
            <Button variant="outline" onClick={() => navigate('/jobs')}>
              <Clock className="mr-2 h-4 w-4" />
              Xem hàng đợi
            </Button>
            <Button variant="outline" onClick={() => navigate('/audit-logs')}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Nhật ký hệ thống
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
