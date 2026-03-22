const ADMIN_AUTH_KEY = 'admin_authenticated'

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return window.localStorage.getItem(ADMIN_AUTH_KEY) === 'true'
}

export function setAdminAuthenticated(value: boolean): void {
  if (typeof window === 'undefined') {
    return
  }

  if (value) {
    window.localStorage.setItem(ADMIN_AUTH_KEY, 'true')
  } else {
    window.localStorage.removeItem(ADMIN_AUTH_KEY)
  }
}
