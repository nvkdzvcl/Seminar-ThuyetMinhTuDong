export type OwnerPoiApprovalStatus = "unregistered" | "pending" | "approved" | "rejected"

export interface OwnerApprovalHistoryItem {
  id: string
  submittedAt: string
  status: Exclude<OwnerPoiApprovalStatus, "unregistered">
  reviewer?: string
  reviewedAt?: string
  reason?: string
}

interface ApiResponse<T> {
  code: string
  message?: string
  result: T
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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/vinhkhanhfoodtour/api"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  const data = (await response.json()) as ApiResponse<T>
  if (!response.ok) {
    throw new Error(data?.message || "Request failed")
  }
  return data.result
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
  const result = await request<ApprovalSummaryApi>(`/poi/shop/${shopId}/approval`)
  return mapSummary(result)
}

export async function submitPoiRegistration(shopId: number): Promise<ApprovalSummary> {
  const result = await request<ApprovalSummaryApi>(`/poi/shop/${shopId}/submit`, {
    method: "POST",
  })
  return mapSummary(result)
}
