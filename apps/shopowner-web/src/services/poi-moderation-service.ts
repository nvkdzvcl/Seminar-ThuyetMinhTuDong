import { apiFetch } from "@/lib/api"

export interface PoiModerationPreviewPayload {
  name?: string
  category?: string
  address?: string
  description?: string
  region?: string
}

export type PoiModerationDecision = "ALLOW" | "WARN" | "BLOCK"

export interface PoiModerationPreviewResult {
  decision: PoiModerationDecision
  status: string
  riskScore: number
  labels: string[]
  matchedTerms: string[]
  reasons: string[]
  suggestedRewrite?: string
  modelVersion?: string
  message: string
}

export async function previewPoiModeration(
  payload: PoiModerationPreviewPayload
): Promise<PoiModerationPreviewResult> {
  return apiFetch<PoiModerationPreviewResult>("/poi/moderation/preview", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
