import { apiFetch } from '@/lib/api'

export interface UiLanguageOption {
  code: string
  displayName: string
  nativeName: string
  direction: string
}

export interface UiLanguageListResponse {
  items: UiLanguageOption[]
  total: number
}

export async function fetchSupportedLanguages(): Promise<UiLanguageListResponse> {
  return apiFetch<UiLanguageListResponse>('/translation/languages')
}
