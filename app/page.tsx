"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user.is_authenticated) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [loading, user.is_authenticated, router])

  // Показываем загрузку во время проверки статуса авторизации
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-lg">Загрузка...</div>
    </div>
  )
}

