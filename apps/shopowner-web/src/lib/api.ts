import { getOwnerAccessToken } from "@/lib/auth"

export interface ApiResponse<T> {
  code: string
  message?: string
  result: T
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/vinhkhanhfoodtour/api"

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as Partial<ApiResponse<unknown>>
    return data?.message || "Request failed"
  } catch {
    return "Request failed"
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getOwnerAccessToken()

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  const data = (await response.json()) as ApiResponse<T>
  return data.result
}
