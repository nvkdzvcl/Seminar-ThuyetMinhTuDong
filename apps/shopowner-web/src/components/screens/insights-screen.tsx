"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  Sparkles,
  QrCode,
  Headphones,
  Clock,
  Utensils
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
  Cell
} from "recharts"

const scanData = [
  { day: "T2", scans: 45 },
  { day: "T3", scans: 62 },
  { day: "T4", scans: 78 },
  { day: "T5", scans: 95 },
  { day: "T6", scans: 127 },
  { day: "T7", scans: 156 },
  { day: "CN", scans: 142 },
]

const languageData = [
  { name: "English", value: 42, color: "oklch(0.5 0.18 25)" },
  { name: "Korean", value: 28, color: "oklch(0.7 0.16 55)" },
  { name: "Japanese", value: 15, color: "oklch(0.85 0.15 85)" },
  { name: "Chinese", value: 10, color: "oklch(0.55 0.12 145)" },
  { name: "Vietnamese", value: 5, color: "oklch(0.45 0.1 200)" },
]

const peakTimeData = [
  { time: "16:00", listens: 12 },
  { time: "17:00", listens: 28 },
  { time: "18:00", listens: 45 },
  { time: "19:00", listens: 78 },
  { time: "20:00", listens: 95 },
  { time: "21:00", listens: 82 },
  { time: "22:00", listens: 48 },
]

const aiInsights = [
  {
    icon: Headphones,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "Audio tiếng Anh được nghe nhiều nhất vào buổi tối",
    description: "Từ 19:00 - 21:00, du khách quốc tế thường xuyên sử dụng audio hướng dẫn.",
  },
  {
    icon: Utensils,
    iconBg: "bg-[oklch(0.7_0.16_55)]/10",
    iconColor: "text-[oklch(0.7_0.16_55)]",
    title: "Ốc hương là món được xem nhiều nhất tuần này",
    description: "Tăng 23% so với tuần trước, đặc biệt phổ biến với khách Hàn Quốc.",
  },
  {
    icon: TrendingUp,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    title: "Lượt quét QR tăng 35% so với tháng trước",
    description: "Nên cân nhắc thêm menu mới để tận dụng lượng khách tăng.",
  },
]

export function InsightsScreen() {
  const totalScans = scanData.reduce((acc, curr) => acc + curr.scans, 0)
  const avgDaily = Math.round(totalScans / 7)

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Thống kê</h1>
        <p className="text-sm text-muted-foreground">7 ngày gần nhất</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Tổng quét QR</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-foreground">{totalScans}</span>
              <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 mb-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +35%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[oklch(0.7_0.16_55)]" />
              <span className="text-xs text-muted-foreground">Trung bình/ngày</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-foreground">{avgDaily}</span>
              <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 mb-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Scans Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Lượt quét QR theo ngày</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scanData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.5 0.18 25)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="oklch(0.5 0.18 25)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'oklch(0.556 0 0)' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'oklch(0.556 0 0)' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'oklch(0.99 0.005 85)',
                    border: '1px solid oklch(0.88 0.02 75)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  labelStyle={{ color: 'oklch(0.2 0.02 30)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="scans" 
                  stroke="oklch(0.5 0.18 25)" 
                  strokeWidth={2}
                  fill="url(#scanGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Language Distribution */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Ngôn ngữ được sử dụng</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={languageData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'oklch(0.2 0.02 30)' }}
                  width={70}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'oklch(0.99 0.005 85)',
                    border: '1px solid oklch(0.88 0.02 75)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Tỷ lệ']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {languageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Peak Listening Times */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Giờ nghe cao điểm</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'oklch(0.556 0 0)' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'oklch(0.556 0 0)' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'oklch(0.99 0.005 85)',
                    border: '1px solid oklch(0.88 0.02 75)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [value, 'Lượt nghe']}
                />
                <Bar dataKey="listens" fill="oklch(0.7 0.16 55)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[oklch(0.85_0.15_85)]" />
          <h2 className="text-base font-semibold text-foreground">AI Insights</h2>
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
