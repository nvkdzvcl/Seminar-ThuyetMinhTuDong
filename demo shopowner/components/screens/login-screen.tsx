"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, Mail, Eye, EyeOff, Store, Utensils, Volume2, QrCode, Globe } from "lucide-react"

interface LoginScreenProps {
  onLogin: () => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate login
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    onLogin()
  }

  return (
    <div className="min-h-screen bg-[oklch(0.22_0.03_30)] flex flex-col">
      {/* Hero section with food street atmosphere */}
      <div className="relative px-6 pt-12 pb-8">
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
      <div className="flex-1 bg-background rounded-t-3xl px-6 pt-8 pb-8">
        <Tabs defaultValue="login" className="w-full">
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
                <Label htmlFor="phone" className="text-foreground font-medium">
                  Số điện thoại
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0912 345 678"
                    className="pl-10 h-12 text-base"
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
                disabled={isLoading}
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shop-name" className="text-foreground font-medium">
                  Tên quán
                </Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="shop-name"
                    type="text"
                    placeholder="Quán Ốc Bà Sáu"
                    className="pl-10 h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-phone" className="text-foreground font-medium">
                  Số điện thoại
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="reg-phone"
                    type="tel"
                    placeholder="0912 345 678"
                    className="pl-10 h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email (tùy chọn)
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="quanoc@email.com"
                    className="pl-10 h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-foreground font-medium">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tạo mật khẩu"
                    className="pr-10 h-12 text-base"
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
                disabled={isLoading}
              >
                {isLoading ? "Đang đăng ký..." : "Đăng ký quán"}
              </Button>

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
