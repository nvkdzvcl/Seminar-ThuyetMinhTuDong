const OWNER_ACCESS_TOKEN_KEY = "owner_access_token"
const OWNER_REFRESH_TOKEN_KEY = "owner_refresh_token"

export function getOwnerAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null
  }
  return window.localStorage.getItem(OWNER_ACCESS_TOKEN_KEY)
}

export function getOwnerRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null
  }
  return window.localStorage.getItem(OWNER_REFRESH_TOKEN_KEY)
}

export function setOwnerSession(accessToken: string, refreshToken?: string): void {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(OWNER_ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) {
    window.localStorage.setItem(OWNER_REFRESH_TOKEN_KEY, refreshToken)
  }
}

export function clearOwnerSession(): void {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.removeItem(OWNER_ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(OWNER_REFRESH_TOKEN_KEY)
}

export function isOwnerAuthenticated(): boolean {
  return Boolean(getOwnerAccessToken())
}
