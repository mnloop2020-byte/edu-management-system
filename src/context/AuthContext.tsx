import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import api from '../api/api'

interface User {
  id: number
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function restoreSession() {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (!savedToken || !savedUser) {
        if (mounted) setIsLoading(false)
        return
      }

      setToken(savedToken)

      try {
        const res = await api.get('/auth/me')
        if (!mounted) return

        localStorage.setItem('user', JSON.stringify(res.data.user))
        setUser(res.data.user)
      } catch {
        if (!mounted) return

        clearSession()
        setToken(null)
        setUser(null)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    restoreSession()
    return () => {
      mounted = false
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { token: nextToken, user: nextUser } = res.data

    localStorage.setItem('token', nextToken)
    localStorage.setItem('user', JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
  }

  const logout = () => {
    clearSession()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
