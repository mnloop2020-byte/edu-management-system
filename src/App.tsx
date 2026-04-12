import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Teachers from './pages/Teachers'
import Attendance from './pages/Attendance'
import Payments from './pages/Payments'
import Reports from './pages/Reports'
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider, useAuth } from './context/AuthContext'

// ── عناوين الصفحات ──────────────────────────────────────
const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/':           { title: 'Dashboard',  subtitle: 'Overview of your institution' },
  '/students':   { title: 'Students',   subtitle: 'Manage enrolled students' },
  '/teachers':   { title: 'Teachers',   subtitle: 'Faculty and staff' },
  '/attendance': { title: 'Attendance', subtitle: 'Track daily attendance' },
  '/payments':   { title: 'Payments',   subtitle: 'Fees and transactions' },
  '/reports':    { title: 'Reports',    subtitle: 'Analytics and insights' },
}

// ── حماية الصفحات ──────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0D0F12]">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// ── TopBar ───────────────────────────────────────────────
function TopBar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const meta = pageTitles[location.pathname] || pageTitles['/']

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-6 shrink-0 bg-[#0D0F12]">
      <div>
        <h1 className="text-[15px] font-semibold text-white leading-none">{meta.title}</h1>
        <p className="text-[11px] text-white/35 mt-0.5">{meta.subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-400 rounded-full" />
        </button>

        <div className="relative group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[11px] font-bold text-white cursor-pointer select-none">
            {initials}
          </div>
          <div className="absolute right-0 top-9 w-36 bg-[#1a1d23] border border-white/[0.08] rounded-xl py-1 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="px-3 py-2 border-b border-white/[0.06]">
              <p className="text-[11px] text-white/80 font-medium truncate">{user?.name}</p>
              <p className="text-[10px] text-white/30 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 text-[12px] text-red-400 hover:bg-white/[0.05] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

// ── Layout ───────────────────────────────────────────────
function Layout() {
  return (
    <div className="flex h-screen bg-[#0D0F12] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
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
    </div>
  )
}

// ── LoginRedirect ────────────────────────────────────────
function LoginRedirect() {
  const { token, isLoading } = useAuth()
  if (isLoading) return null
  return token ? <Navigate to="/" replace /> : <Login />
}

// ── App Root ─────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRedirect />} />
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
    </BrowserRouter>
  )
}

export default App