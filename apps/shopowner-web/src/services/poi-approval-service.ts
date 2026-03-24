import { apiFetch } from "@/lib/api"

export type OwnerPoiApprovalStatus = "unregistered" | "pending" | "approved" | "rejected"

export interface OwnerApprovalHistoryItem {
  id: string
  submittedAt: string
  status: Exclude<OwnerPoiApprovalStatus, "unregistered">
  reviewer?: string
  reviewedAt?: string
  reason?: string
}

interface ApprovalHistoryApiItem {
  id: number
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  reviewer?: string
  reviewedAt?: string
  reason?: string
}

interface ApprovalSummaryApi {
  shopId: number
  poiId?: number
  status: OwnerPoiApprovalStatus
  rejectionReason?: string
  history: ApprovalHistoryApiItem[]
}

export interface ApprovalSummary {
  shopId: number
  poiId?: number
  status: OwnerPoiApprovalStatus
  rejectionReason: string
  history: OwnerApprovalHistoryItem[]
}

function mapSummary(data: ApprovalSummaryApi): ApprovalSummary {
  return {
    shopId: data.shopId,
    poiId: data.poiId,
    status: data.status,
    rejectionReason: data.rejectionReason || "",
    history: data.history.map((item) => ({
      id: String(item.id),
      status: item.status,
      submittedAt: item.submittedAt,
      reviewer: item.reviewer,
      reviewedAt: item.reviewedAt,
      reason: item.reason,
    })),
  }
}

export async function getPoiApprovalSummary(shopId: number): Promise<ApprovalSummary> {
  const result = await apiFetch<ApprovalSummaryApi>(`/poi/shop/${shopId}/approval`)
  return mapSummary(result)
}

export async function submitPoiRegistration(shopId: number): Promise<ApprovalSummary> {
  const result = await apiFetch<ApprovalSummaryApi>(`/poi/shop/${shopId}/submit`, {
    method: "POST",
  })
  return mapSummary(result)
}
