"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, Mail, Eye, EyeOff, Store, Utensils, Volume2, QrCode, Globe } from "lucide-react"

export interface OwnerRegisterFormInput {
  ownerName: string
  shopName?: string
  phoneNumber: string
  email: string
  password: string
}

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (payload: OwnerRegisterFormInput) => Promise<void>
  isLoading: boolean
  isRegistering: boolean
  errorMessage?: string | null
  registerErrorMessage?: string | null
}

export function LoginScreen({
  onLogin,
  onRegister,
  isLoading,
  isRegistering,
  errorMessage,
  registerErrorMessage,
}: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [registerOwnerName, setRegisterOwnerName] = useState("")
  const [registerShopName, setRegisterShopName] = useState("")
  const [registerPhone, setRegisterPhone] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      return
    }
    await onLogin(email.trim(), password)
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registerOwnerName.trim() || !registerPhone.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      return
    }
    const normalizedPhone = registerPhone.replace(/\s+/g, "")
    await onRegister({
      ownerName: registerOwnerName.trim(),
      shopName: registerShopName.trim() || undefined,
      phoneNumber: normalizedPhone,
      email: registerEmail.trim(),
      password: registerPassword,
    })
  }

  return (
    <div className="min-h-screen bg-[oklch(0.22_0.03_30)] md:grid md:grid-cols-[1.05fr_0.95fr]">
      {/* Hero section with food street atmosphere */}
      <div className="relative px-6 pt-12 pb-8 md:flex md:flex-col md:justify-center md:px-10 md:py-12 lg:px-14">
        {/* Decorative street light elements */}
        <div className="absolute top-4 left-6 w-2 h-2 rounded-full bg-[oklch(0.85_0.15_85)] animate-pulse" />
        <div className="absolute top-8 right-8 w-3 h-3 rounded-full bg-[oklch(0.7_0.16_55)] animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-16 left-16 w-2 h-2 rounded-full bg-[oklch(0.5_0.18_25)] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* App Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[oklch(0.5_0.18_25)] shadow-lg mb-4">
            <Utensils className="w-10 h-10 text-[oklch(0.97_0.01_85)]" />
          </div>
          <h1 className="text-2xl font-bold text-[oklch(0.97_0.01_85)] mb-2 text-balance">
            Phố Ẩm Thực Vĩnh Khánh
          </h1>
          <p className="text-[oklch(0.7_0.02_80)] text-sm">
            Thuyết minh tự động đa ngôn ngữ
          </p>
        </div>

        {/* Feature highlights */}
        <div className="flex justify-center gap-6 mb-6">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-[oklch(0.35_0.04_30)] flex items-center justify-center">
              <QrCode className="w-5 h-5 text-[oklch(0.7_0.16_55)]" />
            </div>
            <span className="text-xs text-[oklch(0.7_0.02_80)]">Mã QR</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-[oklch(0.35_0.04_30)] flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-[oklch(0.85_0.15_85)]" />
            </div>
            <span className="text-xs text-[oklch(0.7_0.02_80)]">AI Audio</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-[oklch(0.35_0.04_30)] flex items-center justify-center">
              <Globe className="w-5 h-5 text-[oklch(0.5_0.18_25)]" />
            </div>
            <span className="text-xs text-[oklch(0.7_0.02_80)]">Đa ngôn ngữ</span>
          </div>
        </div>
      </div>

      {/* Login Form Card */}
      <div className="flex-1 rounded-t-3xl bg-background px-6 pt-8 pb-8 md:rounded-none md:rounded-l-3xl md:px-10 md:py-12 lg:px-12">
        <Tabs defaultValue="login" className="w-full md:mx-auto md:max-w-xl">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary">
            <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Đăng nhập
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Đăng ký
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="owner@gmail.com"
                    className="pl-10 h-12 text-base"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    className="pr-10 h-12 text-base"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button type="button" className="text-sm text-primary hover:underline">
                  Quên mật khẩu?
                </button>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                disabled={isLoading || !email.trim() || !password.trim()}
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>

              {errorMessage ? (
                <p className="text-sm text-destructive">{errorMessage}</p>
              ) : null}
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="owner-name" className="text-foreground font-medium">
                  Tên chủ quán
                </Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="owner-name"
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="pl-10 h-12 text-base"
                    value={registerOwnerName}
                    onChange={(event) => setRegisterOwnerName(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-shop-name" className="text-foreground font-medium">
                  Tên quán (tùy chọn)
                </Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="reg-shop-name"
                    type="text"
                    placeholder="Ví dụ: Quán Ốc Bà Sáu"
                    className="pl-10 h-12 text-base"
                    value={registerShopName}
                    onChange={(event) => setRegisterShopName(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-phone" className="text-foreground font-medium">
                  Số điện thoại
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="register-phone"
                    type="tel"
                    placeholder="0912 345 678"
                    className="pl-10 h-12 text-base"
                    value={registerPhone}
                    onChange={(event) => setRegisterPhone(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-foreground font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="quanoc@email.com"
                    className="pl-10 h-12 text-base"
                    value={registerEmail}
                    onChange={(event) => setRegisterEmail(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-foreground font-medium">
                  Mật khẩu (tối thiểu 8 ký tự)
                </Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tạo mật khẩu"
                    className="pr-10 h-12 text-base"
                    minLength={8}
                    value={registerPassword}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                disabled={
                  isRegistering ||
                  !registerOwnerName.trim() ||
                  !registerPhone.trim() ||
                  !registerEmail.trim() ||
                  registerPassword.length < 8
                }
              >
                {isRegistering ? "Đang tạo tài khoản..." : "Đăng ký quán"}
              </Button>

              {registerErrorMessage ? <p className="text-sm text-destructive">{registerErrorMessage}</p> : null}

              <p className="text-xs text-muted-foreground">
                Sau khi đăng ký thành công, hệ thống sẽ tự đăng nhập để bạn tạo hồ sơ quán.
              </p>

              <p className="text-xs text-center text-muted-foreground">
                Bằng cách đăng ký, bạn đồng ý với{" "}
                <span className="text-primary">Điều khoản sử dụng</span> và{" "}
                <span className="text-primary">Chính sách bảo mật</span>
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
