"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  Sparkles,
  QrCode,
  Users,
  Clock,
  Utensils,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts"
import { getOwnerInsights, type OwnerInsights } from "@/services/insights-service"

const LANGUAGE_COLORS = [
  "oklch(0.5 0.18 25)",
  "oklch(0.7 0.16 55)",
  "oklch(0.85 0.15 85)",
  "oklch(0.55 0.12 145)",
  "oklch(0.45 0.1 200)",
  "oklch(0.62 0.14 320)",
]

export function InsightsScreen() {
  const [insights, setInsights] = useState<OwnerInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let cancelled = false
    const loadInsights = async () => {
      setIsLoading(true)
      setErrorMessage("")
      try {
        const result = await getOwnerInsights()
        if (cancelled) return
        setInsights(result)
      } catch (error) {
        if (cancelled) return
        setErrorMessage(error instanceof Error ? error.message : "Không tải được thống kê.")
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInsights()
    return () => {
      cancelled = true
    }
  }, [])

  const dailyVisitData = useMemo(() => {
    if (!insights?.dailyMetrics?.length) {
      return []
    }
    return insights.dailyMetrics.map((item) => ({
      day: item.date,
      visits: item.visits ?? 0,
      audioCompletions: item.audioCompletions ?? 0,
    }))
  }, [insights?.dailyMetrics])

  const languageData = useMemo(() => {
    const metrics = insights?.languageMetrics ?? []
    if (metrics.length === 0) {
      return []
    }
    const total = metrics.reduce((acc, item) => acc + (item.count ?? 0), 0)
    return metrics.map((item, index) => {
      const count = item.count ?? 0
      const percent = total > 0 ? Math.round((count * 100) / total) : 0
      return {
        name: item.language || "Unknown",
        count,
        percent,
        color: LANGUAGE_COLORS[index % LANGUAGE_COLORS.length],
      }
    })
  }, [insights?.languageMetrics])

  const topDishData = useMemo(() => {
    return (insights?.topDishMetrics ?? []).map((item) => ({
      dish: item.dishName || "Khác",
      quantity: item.quantity ?? 0,
    }))
  }, [insights?.topDishMetrics])

  const aiInsights = useMemo(() => {
    if (!insights || insights.totalVisits7Days <= 0) {
      return [
        {
          icon: Sparkles,
          iconBg: "bg-primary/10",
          iconColor: "text-primary",
          title: "Chưa có dữ liệu tương tác 7 ngày gần nhất",
          description: "Khi khách quét QR hoặc nghe audio, thống kê hành vi sẽ hiển thị tại đây.",
        },
      ]
    }

    const topLanguage = languageData[0]
    const topDish = topDishData[0]
    const growthPercent = insights.growthPercent ?? 0

    return [
      {
        icon: QrCode,
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
        title: `Quán có ${insights.totalVisits7Days} lượt ghé trong 7 ngày`,
        description: `Trung bình ${insights.avgDailyVisits} lượt/ngày, ${insights.uniqueSessions7Days} phiên tương tác khác nhau.`,
      },
      topLanguage
        ? {
            icon: Users,
            iconBg: "bg-[oklch(0.7_0.16_55)]/10",
            iconColor: "text-[oklch(0.7_0.16_55)]",
            title: `Ngôn ngữ nổi bật: ${topLanguage.name}`,
            description: `Chiếm khoảng ${topLanguage.percent}% dữ liệu tương tác QR/audio.`,
          }
        : null,
      topDish
        ? {
            icon: Utensils,
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-600",
            title: `Món được nghe nhiều: ${topDish.dish}`,
            description: `${topDish.quantity} lượt phát audio hoàn tất trong 7 ngày gần nhất.`,
          }
        : null,
      {
        icon: TrendingUp,
        iconBg: "bg-sky-500/10",
        iconColor: "text-sky-600",
        title: growthPercent >= 0 ? "Xu hướng tăng trưởng tích cực" : "Xu hướng giảm so với tuần trước",
        description: `Biến động tuần này: ${growthPercent >= 0 ? "+" : ""}${growthPercent}% so với 7 ngày trước.`,
      },
    ].filter(Boolean) as Array<{
      icon: typeof Sparkles
      iconBg: string
      iconColor: string
      title: string
      description: string
    }>
  }, [insights, languageData, topDishData])

  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Đang tải thống kê thực tế...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="px-4 pt-6 pb-4">
        <Card className="bg-card border-destructive/30">
          <CardContent className="p-6 text-sm text-destructive">
            {errorMessage}
          </CardContent>
        </Card>
      </div>
    )
  }

  const growthPercent = insights?.growthPercent ?? 0
  const growthText = `${growthPercent >= 0 ? "+" : ""}${growthPercent}%`

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Thống kê</h1>
        <p className="text-sm text-muted-foreground">Dữ liệu thật từ 7 ngày gần nhất</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Lượt ghé</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-foreground">{insights?.totalVisits7Days ?? 0}</span>
              <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 mb-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                {growthText}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[oklch(0.7_0.16_55)]" />
              <span className="text-xs text-muted-foreground">TB/ngày</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{insights?.avgDailyVisits ?? 0}</span>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Utensils className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Audio hoàn tất 7 ngày</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{insights?.totalAudioCompletions7Days ?? 0}</span>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-sky-600" />
              <span className="text-xs text-muted-foreground">Phiên duy nhất</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{insights?.uniqueSessions7Days ?? 0}</span>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Lượt ghé theo ngày</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyVisitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.5 0.18 25)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.5 0.18 25)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "oklch(0.556 0 0)" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "oklch(0.556 0 0)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.99 0.005 85)",
                    border: "1px solid oklch(0.88 0.02 75)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  stroke="oklch(0.5 0.18 25)"
                  strokeWidth={2}
                  fill="url(#scanGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Ngôn ngữ khách hàng</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[170px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={languageData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "oklch(0.2 0.02 30)" }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.99 0.005 85)",
                    border: "1px solid oklch(0.88 0.02 75)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(_value: number, _name, item) => {
                    const payload = item?.payload as { count?: number; percent?: number } | undefined
                    return [`${payload?.count ?? 0} lượt (${payload?.percent ?? 0}%)`, "Ngôn ngữ"]
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {languageData.map((entry, index) => (
                    <Cell key={`language-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Món được nghe nhiều</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDishData} margin={{ top: 10, right: 10, left: 20, bottom: 15 }}>
                <XAxis
                  dataKey="dish"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "oklch(0.556 0 0)" }}
                  interval={0}
                  angle={-10}
                  textAnchor="end"
                  height={45}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "oklch(0.556 0 0)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.99 0.005 85)",
                    border: "1px solid oklch(0.88 0.02 75)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`${value}`, "Số lượt nghe xong"]}
                />
                <Bar dataKey="quantity" fill="oklch(0.7 0.16 55)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[oklch(0.85_0.15_85)]" />
          <h2 className="text-base font-semibold text-foreground">Insights</h2>
        </div>

        <div className="space-y-3">
          {aiInsights.map((insight, index) => {
            const Icon = insight.icon
            return (
              <Card key={index} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full ${insight.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${insight.iconColor}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
