"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { login as apiLogin, logout as apiLogout, getUserInfo } from "./auth"
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'

interface User {
  id?: number
  username?: string
  email?: string
  groups?: string[]
  is_authenticated: boolean
}

interface AuthContextType {
  user: User
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USER_COOKIE_KEY = 'user_data';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User>(() => {
    const savedUser = Cookies.get(USER_COOKIE_KEY);
    return savedUser ? JSON.parse(savedUser) : { is_authenticated: false };
  })
  const [loading, setLoading] = useState(!user.is_authenticated)

  const refreshAuth = async () => {
    try {
      const userInfo = await getUserInfo()
      setUser(userInfo)
      // Сохраняем данные в куки
      Cookies.set(USER_COOKIE_KEY, JSON.stringify(userInfo), { expires: 1 })
    } catch (error) {
      setUser({ is_authenticated: false })
      Cookies.remove(USER_COOKIE_KEY)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    const result = await apiLogin(username, password)
    if (result.success) {
      await refreshAuth()
    } else {
      throw new Error(result.message)
    }
  }

  const logout = async () => {
    try {
      await apiLogout()
      setUser({ is_authenticated: false })
      Cookies.remove(USER_COOKIE_KEY)
      // Редирект на страницу входа
      router.push('/login')
    } catch (error) {
      console.error('Error during logout:', error)
      // Даже если произошла ошибка, очищаем данные пользователя
      setUser({ is_authenticated: false })
      Cookies.remove(USER_COOKIE_KEY)
      // Редирект на страницу входа даже при ошибке
      router.push('/login')
    }
  }

  useEffect(() => {
    if (!user.is_authenticated) {
      refreshAuth()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 