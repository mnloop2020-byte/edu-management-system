import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Teachers from './pages/Teachers'
import Attendance from './pages/Attendance'
import Payments from './pages/Payments'
import Reports from './pages/Reports'
import Login from './pages/Login'
import Register from './pages/Register'
import Chatbot from './components/Chatbot'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './hooks/useTheme'
import { ToastContainer } from './components/ui/Toast'
import { useState, useRef, useEffect } from 'react'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/':           { title: 'Dashboard',  subtitle: 'Overview of your institution' },
  '/students':   { title: 'Students',   subtitle: 'Manage enrolled students' },
  '/teachers':   { title: 'Teachers',   subtitle: 'Faculty and staff' },
  '/attendance': { title: 'Attendance', subtitle: 'Track daily attendance' },
  '/payments':   { title: 'Payments',   subtitle: 'Fees and transactions' },
  '/reports':    { title: 'Reports',    subtitle: 'Analytics and insights' },
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center animate-pulse">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }
  if (!token) return <Navigate to="/landing" replace />
  return <>{children}</>
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
      style={{ color: 'var(--text-muted)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent';             e.currentTarget.style.color = 'var(--text-muted)' }}
    >
      {theme === 'dark' ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  )
}

function TopBar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [search, setSearch] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const meta = pageTitles[location.pathname] || pageTitles['/']

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header
      className="h-14 flex items-center justify-between px-6 shrink-0 gap-4"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      {/* Page Title */}
      <div className="animate-fade-in">
        <h1 className="text-[15px] font-bold leading-none" style={{ color: 'var(--text)' }}>{meta.title}</h1>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{meta.subtitle}</p>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div
          className="hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5 cursor-text"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', minWidth: 180 }}
          onClick={() => document.getElementById('topbar-search')?.focus()}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-faint)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            id="topbar-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="bg-transparent text-[12px] outline-none flex-1"
            style={{ color: 'var(--text)', caretColor: 'var(--accent)' }}
          />
          <kbd className="text-[9px] border rounded px-1 py-0.5" style={{ color: 'var(--text-faint)', borderColor: 'var(--border)' }}>⌘K</kbd>
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button
          className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-all"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent';             e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-400 rounded-full" />
        </button>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-2 rounded-xl px-2 py-1 transition-all"
            style={{ color: 'var(--text)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[11px] font-bold text-white select-none">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-[12px] font-semibold leading-none" style={{ color: 'var(--text)' }}>{user?.name}</p>
              <p className="text-[10px] capitalize" style={{ color: 'var(--text-muted)' }}>{user?.role?.toLowerCase()}</p>
            </div>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-muted)' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-11 w-48 rounded-xl py-1 shadow-2xl z-50 animate-scale-in"
              style={{ background: 'var(--surface-2, #1C1F27)', border: '1px solid var(--border)' }}
            >
              <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.name}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              </div>
              <button
                onClick={() => { setProfileOpen(false); logout() }}
                className="w-full text-left px-3 py-2 text-[12px] text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 mt-0.5"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function Layout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg)' }}>
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/students"   element={<Students />} />
            <Route path="/teachers"   element={<Teachers />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/payments"   element={<Payments />} />
            <Route path="/reports"    element={<Reports />} />
          </Routes>
        </main>
      </div>
      <Chatbot />
    </div>
  )
}

function LoginRedirect() {
  const { token, isLoading } = useAuth()
  if (isLoading) return null
  if (token) return <Navigate to="/" replace />
  return <Login />
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastContainer />
          <Routes>
            <Route path="/landing"  element={<Landing />} />
            <Route path="/login"    element={<LoginRedirect />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
