export interface ApiResponse<T> {
  code: string
  message?: string
  result: T
}

export interface PagingResponse<T> {
  items: T[]
  totalItems: number
  currentPage: number
  pageSize: number
  totalPages: number
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/vinhkhanhfoodtour/api'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  const data = (await response.json()) as ApiResponse<T>
  if (!response.ok) {
    throw new Error(data?.message || 'Request failed')
  }

  return data.result
}
