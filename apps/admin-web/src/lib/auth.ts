const ADMIN_ACCESS_TOKEN_KEY = 'admin_access_token'
const ADMIN_REFRESH_TOKEN_KEY = 'admin_refresh_token'

interface AdminAccessTokenPayload {
  exp?: number
  scope?: string
  tokenType?: string
}

export function isAdminAuthenticated(): boolean {
  const accessToken = getAdminAccessToken()
  if (!accessToken) {
    return false
  }

  const isTokenValid = isValidAdminAccessToken(accessToken)
  if (!isTokenValid) {
    clearAdminSession()
  }

  return isTokenValid
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

function isValidAdminAccessToken(token: string): boolean {
  const payload = decodeTokenPayload(token)
  if (!payload) {
    return false
  }

  if (payload.tokenType !== 'ACCESS') {
    return false
  }

  if (!hasAdminScope(payload.scope)) {
    return false
  }

  if (typeof payload.exp !== 'number') {
    return false
  }

  const nowInSeconds = Math.floor(Date.now() / 1000)
  return payload.exp > nowInSeconds
}

function hasAdminScope(scope?: string): boolean {
  if (!scope) {
    return false
  }

  const scopes = scope
    .split(' ')
    .map((value) => value.trim())
    .filter(Boolean)

  return scopes.includes('ADMIN') || scopes.includes('SUPER_ADMIN')
}

function decodeTokenPayload(token: string): AdminAccessTokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }

  const payloadPart = parts[1]
  try {
    const normalizedPayload = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const paddingLength = (4 - (normalizedPayload.length % 4)) % 4
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + paddingLength,
      '='
    )
    const decodedPayload = atob(paddedPayload)
    return JSON.parse(decodedPayload) as AdminAccessTokenPayload
  } catch {
    return null
  }
}
