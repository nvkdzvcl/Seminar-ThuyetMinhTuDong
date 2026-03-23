import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lock, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/api'
import { isAdminAuthenticated, setAdminSession } from '@/lib/auth'

interface AdminLoginResponse {
  accessToken: string
  refreshToken: string
  authenticated: boolean
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const redirectTo = useMemo(() => {
    const from = (location.state as { from?: string } | null)?.from
    return from && from !== '/login' ? from : '/dashboard'
  }, [location.state])

  useEffect(() => {
    document.body.style.pointerEvents = ''
    document.body.style.overflow = ''
  }, [])

  if (isAdminAuthenticated()) {
    return <Navigate to={redirectTo} replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu')
      return
    }

    try {
      const result = await apiFetch<AdminLoginResponse>('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: username.trim(),
          password: password.trim(),
        }),
      })

      if (!result.authenticated || !result.accessToken) {
        setError('Đăng nhập thất bại, vui lòng kiểm tra lại thông tin')
        return
      }

      setAdminSession(result.accessToken, result.refreshToken)
      navigate(redirectTo, { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Đăng nhập thất bại')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d1a20] text-white">
      <img
        src="/images/backgrounds/bg-login.jpg"
        alt="Admin login background"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-y-0 left-1/2 hidden w-[460px] -translate-x-1/2 bg-black/35 backdrop-blur-md md:block" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <section className="w-full max-w-md p-2">
          <header className="mb-6 text-center">
            <img
              src="/images/brand/logo.png"
              alt="Logo"
              className="mx-auto mb-4 h-20 w-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.55)]"
            />
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">Admin Panel</p>
            <h1 className="mt-2 text-3xl font-semibold">Đăng nhập quản trị</h1>
            <p className="mt-2 text-sm text-white/70">Hệ thống quản lý POI Audio Guide</p>
          </header>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/90">Tài khoản</span>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Nhập tài khoản (admin)"
                  className="h-11 border-white/25 bg-black/45 pl-10 text-white placeholder:text-white/45 focus-visible:ring-emerald-400/60"
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/90">Mật khẩu</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="h-11 border-white/25 bg-black/45 pl-10 text-white placeholder:text-white/45 focus-visible:ring-emerald-400/60"
                />
              </div>
            </label>

            {error && <p className="text-sm text-rose-300">{error}</p>}

            <Button
              type="submit"
              className="h-11 w-full bg-teal-600 text-base font-medium text-white transition hover:bg-teal-500"
            >
              Đăng nhập
            </Button>
          </form>
        </section>
      </main>
    </div>
  )
}
