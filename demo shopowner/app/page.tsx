"use client"

import { useState } from "react"
import { LoginScreen } from "@/components/screens/login-screen"
import { AppShell } from "@/components/app-shell"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />
  }

  return <AppShell />
}
