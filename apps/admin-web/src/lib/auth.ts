const ADMIN_ACCESS_TOKEN_KEY = 'admin_access_token'
const ADMIN_REFRESH_TOKEN_KEY = 'admin_refresh_token'

export function isAdminAuthenticated(): boolean {
  return Boolean(getAdminAccessToken())
}

export function getAdminAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY)
}

export function getAdminRefreshToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY)
}

export function setAdminSession(accessToken: string, refreshToken?: string): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) {
    window.localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken)
  }
}

export function clearAdminSession(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY)
}
