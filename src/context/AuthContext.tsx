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
const TOKEN_KEY = 'token'
const USER_KEY = 'user'
const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 1000
const parsedIdleTimeout = Number(import.meta.env.VITE_IDLE_TIMEOUT_MS)
const IDLE_TIMEOUT_MS =
  Number.isFinite(parsedIdleTimeout) && parsedIdleTimeout >= 60_000
    ? parsedIdleTimeout
    : DEFAULT_IDLE_TIMEOUT_MS

function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function readStoredSession() {
  const sessionToken = sessionStorage.getItem(TOKEN_KEY)
  const sessionUser = sessionStorage.getItem(USER_KEY)
  if (sessionToken && sessionUser) {
    return { token: sessionToken, user: sessionUser }
  }

  // Legacy fallback for old saved sessions; migrate to session storage.
  const legacyToken = localStorage.getItem(TOKEN_KEY)
  const legacyUser = localStorage.getItem(USER_KEY)
  if (legacyToken && legacyUser) {
    sessionStorage.setItem(TOKEN_KEY, legacyToken)
    sessionStorage.setItem(USER_KEY, legacyUser)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    return { token: legacyToken, user: legacyUser }
  }

  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function restoreSession() {
      const savedSession = readStoredSession()
      if (!savedSession) {
        if (mounted) setIsLoading(false)
        return
      }

      setToken(savedSession.token)

      try {
        const res = await api.get('/auth/me')
        if (!mounted) return

        sessionStorage.setItem(USER_KEY, JSON.stringify(res.data.user))
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

    sessionStorage.setItem(TOKEN_KEY, nextToken)
    sessionStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(nextToken)
    setUser(nextUser)
  }

  const logout = () => {
    clearSession()
    setToken(null)
    setUser(null)
  }

  useEffect(() => {
    if (!token) return

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const activityEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'touchstart',
      'scroll',
    ]

    const handleIdleTimeout = () => {
      clearSession()
      setToken(null)
      setUser(null)
    }

    const scheduleTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(handleIdleTimeout, IDLE_TIMEOUT_MS)
    }

    const handleActivity = () => {
      if (document.visibilityState === 'hidden') return
      scheduleTimeout()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleTimeout()
      }
    }

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity)
    })
    document.addEventListener('visibilitychange', handleVisibilityChange)
    scheduleTimeout()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [token])

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
