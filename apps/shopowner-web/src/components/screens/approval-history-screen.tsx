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
      <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-600">
        Đã duyệt
      </Badge>
    )
  }
  if (status === "pending") {
    return (
      <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-600">
        Chờ duyệt
      </Badge>
    )
  }
  return (
    <Badge className="border-destructive/30 bg-destructive/10 text-destructive">
      Bị từ chối
    </Badge>
  )
}

function getStatusIcon(status: ApprovalHistoryItem["status"]) {
  if (status === "approved") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
  if (status === "pending") return <Clock3 className="h-4 w-4 text-amber-600" />
  return <XCircle className="h-4 w-4 text-destructive" />
}

export function ApprovalHistoryScreen({ onBack, history }: ApprovalHistoryScreenProps) {
  return (
    <div className="min-h-screen space-y-4 bg-background px-4 pt-6 pb-24 md:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Lịch sử duyệt POI</h1>
          <p className="text-sm text-muted-foreground">Theo dõi các lần gửi đăng ký quán</p>
        </div>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Chưa có lần gửi duyệt nào.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {history.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <p className="text-sm font-medium">Gửi lúc {item.submittedAt}</p>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                {item.reviewedAt ? (
                  <p className="text-xs text-muted-foreground">
                    Duyệt lúc: {item.reviewedAt} {item.reviewer ? `- ${item.reviewer}` : ""}
                  </p>
                ) : null}

                {item.reason ? (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="mb-1 text-xs text-muted-foreground">Lý do</p>
                    <p className="text-sm text-foreground">{item.reason}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
