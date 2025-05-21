"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "./api-client"

interface User {
  id: string
  username: string
  email?: string
  full_name: string
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Проверяем аутентификацию при загрузке
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const userData = await authApi.me()
      setIsAuthenticated(true)
      setUser(userData)
    } catch (error) {
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password);
      
      if (response.success) {
        const userData = await authApi.me()
        setIsAuthenticated(true)
        setUser(userData)
        window.location.href = "/dashboard";
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
      setIsAuthenticated(false)
      setUser(null)
      // Принудительно очищаем все куки
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
      // Перенаправляем на страницу входа
      router.push("/login")
      // Принудительно обновляем страницу для очистки состояния
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
      // Даже если произошла ошибка, все равно перенаправляем на страницу входа
      router.push("/login")
      window.location.href = "/login"
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 