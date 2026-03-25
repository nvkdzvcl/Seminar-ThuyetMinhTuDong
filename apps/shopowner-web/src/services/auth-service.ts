import { apiFetch } from "@/lib/api"

export interface LoginPayload {
  email: string
  password: string
}

export interface OwnerRegisterPayload {
  fullName: string
  phoneNumber: string
  email: string
  password: string
  language?: string
}

export interface AuthUser {
  id: number
  fullName: string
  phoneNumber?: string
  email: string
  language?: string
  role: string
  createdAt?: string
  status?: string
}

export interface LoginResult {
  accessToken: string
  refreshToken?: string
  authenticated: boolean
  user: AuthUser
}

export interface OwnerRegisterResult {
  isRegistered?: boolean
  registered?: boolean
}

export function login(payload: LoginPayload): Promise<LoginResult> {
  return apiFetch<LoginResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function registerOwner(payload: OwnerRegisterPayload): Promise<OwnerRegisterResult> {
  return apiFetch<OwnerRegisterResult>("/user/register-owner", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function getCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me", {
    method: "GET",
  })
}

export function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", {
    method: "POST",
  })
}
