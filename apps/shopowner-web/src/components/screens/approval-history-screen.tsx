"use client"

import { ArrowLeft, CheckCircle2, Clock3, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ApprovalHistoryItem } from "@/components/app-shell"

interface ApprovalHistoryScreenProps {
  onBack: () => void
  history: ApprovalHistoryItem[]
}

function getStatusBadge(status: ApprovalHistoryItem["status"]) {
  if (status === "approved") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
        Đã duyệt
      </Badge>
    )
  }
  if (status === "pending") {
    return (
      <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">
        Chờ duyệt
      </Badge>
    )
  }
  return (
    <Badge className="bg-destructive/10 text-destructive border-destructive/30">
      Bị từ chối
    </Badge>
  )
}

function getStatusIcon(status: ApprovalHistoryItem["status"]) {
  if (status === "approved") return <CheckCircle2 className="w-4 h-4 text-emerald-600" />
  if (status === "pending") return <Clock3 className="w-4 h-4 text-amber-600" />
  return <XCircle className="w-4 h-4 text-destructive" />
}

export function ApprovalHistoryScreen({ onBack, history }: ApprovalHistoryScreenProps) {
  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Lịch sử duyệt POI</h1>
          <p className="text-sm text-muted-foreground">Theo dõi các lần gửi đăng ký quán</p>
        </div>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground text-center">
            Chưa có lần gửi duyệt nào.
          </CardContent>
        </Card>
      ) : (
        history.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <p className="text-sm font-medium">Gửi lúc {item.submittedAt}</p>
                </div>
                {getStatusBadge(item.status)}
              </div>
              {item.reviewedAt && (
                <p className="text-xs text-muted-foreground">
                  Duyệt lúc: {item.reviewedAt} {item.reviewer ? `- ${item.reviewer}` : ""}
                </p>
              )}
              {item.reason && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-1">Lý do</p>
                  <p className="text-sm">{item.reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
