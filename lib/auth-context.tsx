"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { login as apiLogin, logout as apiLogout, getUserInfo } from "./auth"

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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>({ is_authenticated: false })
  const [loading, setLoading] = useState(true)

  const refreshAuth = async () => {
    try {
      const userInfo = await getUserInfo()
      setUser(userInfo)
    } catch (error) {
      setUser({ is_authenticated: false })
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
    await apiLogout()
    setUser({ is_authenticated: false })
  }

  useEffect(() => {
    refreshAuth()
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
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 