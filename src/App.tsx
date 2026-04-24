import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Chatbot from './components/Chatbot'
import api from './api/api'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './hooks/useTheme'
import { LocaleProvider, useLocale } from './hooks/useLocale'
import { ToastContainer } from './components/ui/Toast'
import { useState, useRef, useEffect, lazy, Suspense } from 'react'

const Landing = lazy(() => import('./pages/Landing'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Students = lazy(() => import('./pages/Students'))
const Teachers = lazy(() => import('./pages/Teachers'))
const Attendance = lazy(() => import('./pages/Attendance'))
const Payments = lazy(() => import('./pages/Payments'))
const Reports = lazy(() => import('./pages/Reports'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Assignments = lazy(() => import('./pages/Assignments'))
const TeacherPerformance = lazy(() => import('./pages/TeacherPerformance'))
const StudentProfile = lazy(() => import('./pages/StudentProfile'))
const Gradebook = lazy(() => import('./pages/Gradebook'))
const Communications = lazy(() => import('./pages/Communications'))
const Parents = lazy(() => import('./pages/Parents'))
const AuditLog = lazy(() => import('./pages/AuditLog'))
const Transcripts = lazy(() => import('./pages/Transcripts'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))

interface SearchResultItem {
  id: number | string
  title: string
  subtitle: string
}

interface SearchResults {
  students: SearchResultItem[]
  teachers: SearchResultItem[]
  payments: SearchResultItem[]
  assignments: SearchResultItem[]
  reports: SearchResultItem[]
}

interface NotificationItem {
  type: string
  icon: string
  title: string
  description: string
  path: string
  createdAt: string
}

function localizeNotificationStatus(value: string, locale: 'ar' | 'en') {
  if (locale !== 'ar') return value
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'present') return 'حاضر'
  if (normalized === 'late') return 'متأخر'
  if (normalized === 'absent') return 'غائب'
  return value
}

function localizeNotificationText(value: string, locale: 'ar' | 'en') {
  const raw = String(value || '').trim()
  if (!raw || locale !== 'ar') return raw

  let result = raw
  result = result.replace(/^Attendance dropped this week$/i, 'انخفض الحضور هذا الأسبوع')
  result = result.replace(/^Enrollment slowed this month$/i, 'انخفض التسجيل هذا الشهر')
  result = result.replace(/^Open payments to review overdue balances$/i, 'افتح المدفوعات لمراجعة المبالغ المتأخرة')
  result = result.replace(/^Review daily attendance trends and at-risk students$/i, 'راجع اتجاهات الحضور اليومية والطلاب المعرضين للخطر')
  result = result.replace(/^Student registrations are down compared with last month$/i, 'تسجيلات الطلاب أقل مقارنة بالشهر الماضي')
  result = result.replace(
    /^(.+) is over the absence limit$/i,
    (_, name) => `${name} تجاوز حد الغياب`,
  )
  result = result.replace(
    /^(.+) is near the absence limit$/i,
    (_, name) => `${name} قريب من حد الغياب`,
  )
  result = result.replace(
    /^(\d+) absences recorded this semester$/i,
    (_, count) => `تم تسجيل ${count} حالات غياب هذا الفصل`,
  )
  result = result.replace(
    /^(\d+) overdue payments need follow-up$/i,
    (_, count) => `يوجد ${count} مدفوعات متأخرة تحتاج متابعة`,
  )
  result = result.replace(
    /^(.+) marked (.+)$/i,
    (_, name, status) => `${name} تم تسجيله ${localizeNotificationStatus(status, locale)}`,
  )
  result = result.replace(
    /^(.+) paid ([\d.,]+) SAR$/i,
    (_, name, amount) => `${name} دفع ${amount} ر.س`,
  )
  return result
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

function RoleRoute({ allowed, children }: { allowed: string[]; children: React.ReactNode }) {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()

  if (!role || !allowed.includes(role)) {
    return <Navigate to="/" replace />
  }

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

function RouteFallback() {
  return (
    <div className="card p-6 text-[13px]" style={{ color: 'var(--text-muted)' }}>
      Loading...
    </div>
  )
}

function TopBar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { text, isRtl } = useLocale()
  const role = String(user?.role || '').toUpperCase()
  const isStudent = role === 'STUDENT'
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResults>({ students: [], teachers: [], payments: [], assignments: [], reports: [] })
  const [searchOpen, setSearchOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const profileRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const meta = location.pathname.startsWith('/students/')
    ? text.pages['/students/profile']
    : text.pages[location.pathname as keyof typeof text.pages] || text.pages['/']

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen(open => !open)
      }
      if (e.key === 'Escape') setCommandOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  async function apiFetchDashboardNotifications() {
    try {
      const res = await api.get('/dashboard')
      setNotifications(res.data.notifications ?? [])
    } catch {
      setNotifications([])
    }
  }

  useEffect(() => {
    if (!search.trim()) {
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/search', { params: { q: search } })
        setResults(res.data.results)
        setSearchOpen(true)
      } catch {
        setResults({ students: [], teachers: [], payments: [], assignments: [], reports: [] })
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [search])

  async function handleNotificationsToggle() {
    const nextOpen = !notificationsOpen
    setNotificationsOpen(nextOpen)
    if (nextOpen) {
      await apiFetchDashboardNotifications()
    }
  }

  const visibleResults = search.trim()
    ? results
    : { students: [], teachers: [], payments: [], assignments: [], reports: [] }

  const resultGroups = [
    { key: 'students', label: text.nav.students, items: visibleResults.students, path: '/students' },
    { key: 'teachers', label: text.nav.teachers, items: visibleResults.teachers, path: '/teachers' },
    { key: 'payments', label: text.nav.payments, items: visibleResults.payments, path: '/payments' },
    { key: 'assignments', label: text.nav.assignments, items: visibleResults.assignments, path: '/assignments' },
    { key: 'reports', label: text.nav.reports, items: visibleResults.reports, path: '/reports' },
  ] as const

  const commandGroups = isStudent
    ? [
        {
          label: text.commands.navigate,
          items: [
            { id: 'nav-dashboard', title: text.nav.dashboard, subtitle: text.commands.institutionOverview, path: '/' },
            { id: 'nav-profile', title: isRtl ? 'ملفي الدراسي' : 'My Profile', subtitle: text.pages['/students/profile'].subtitle, path: '/students/me' },
            { id: 'nav-transcripts', title: text.nav.transcripts, subtitle: text.pages['/transcripts'].subtitle, path: '/transcripts' },
            { id: 'nav-assignments', title: text.nav.assignments, subtitle: text.commands.openAssignmentsWorkspace, path: '/assignments' },
            { id: 'nav-calendar', title: text.nav.calendar, subtitle: text.commands.deadlinesAndEvents, path: '/calendar' },
            { id: 'nav-payments', title: text.nav.payments, subtitle: text.commands.revenueDesk, path: '/payments' },
            { id: 'nav-communications', title: text.nav.communications, subtitle: text.pages['/communications'].subtitle, path: '/communications' },
          ],
        },
      ]
    : [
        {
          label: text.commands.actions,
          items: [
            { id: 'action-student', title: text.commands.addStudent, subtitle: text.commands.openStudentWorkspace, path: '/students' },
            { id: 'action-attendance', title: text.commands.takeAttendance, subtitle: text.commands.openAttendanceDesk, path: '/attendance' },
            { id: 'action-assignment', title: text.commands.createAssignment, subtitle: text.commands.openAssignmentsWorkspace, path: '/assignments' },
            { id: 'action-report', title: text.commands.openReports, subtitle: text.commands.viewAnalyticsAndExports, path: '/reports' },
          ],
        },
        {
          label: text.commands.navigate,
          items: [
            { id: 'nav-dashboard', title: text.nav.dashboard, subtitle: text.commands.institutionOverview, path: '/' },
            { id: 'nav-students', title: text.nav.students, subtitle: text.commands.studentsWorkspace, path: '/students' },
            { id: 'nav-payments', title: text.nav.payments, subtitle: text.commands.revenueDesk, path: '/payments' },
            { id: 'nav-calendar', title: text.nav.calendar, subtitle: text.commands.deadlinesAndEvents, path: '/calendar' },
          ],
        },
      ]

  const paletteResults = [
    ...commandGroups.map(group => ({
      label: group.label,
      items: group.items.filter(item =>
        !search.trim() ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(search.toLowerCase())
      ),
    })),
    ...resultGroups.map(group => ({
      label: group.label,
      items: group.items.map(item => ({
        id: `${group.key}-${item.id}`,
        title: item.title,
        subtitle: item.subtitle,
        path: group.key === 'students' ? (isStudent ? '/students/me' : `/students/${item.id}`) : group.path,
      })),
    })),
  ].filter(group => group.items.length > 0)

  return (
    <>
      {commandOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4" style={{ background: 'rgba(5,7,10,0.62)', backdropFilter: 'blur(12px)' }}>
          <div className="w-full max-w-[720px] rounded-2xl overflow-hidden shadow-2xl animate-scale-in" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-faint)' }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  autoFocus
                  value={search}
                  onChange={e => {
                    const value = e.target.value
                    setSearch(value)
                    setSearchOpen(Boolean(value.trim()))
                  }}
                  placeholder={text.shell.searchAnything}
                  className="bg-transparent outline-none text-[14px] flex-1"
                  style={{ color: 'var(--text)', textAlign: isRtl ? 'right' : 'left' }}
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
                <kbd className="text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--text-faint)' }}>ESC</kbd>
              </div>
            </div>
            <div className="max-h-[520px] overflow-y-auto p-3 space-y-3">
              {paletteResults.length === 0 ? (
                <p className="text-[12px] px-3 py-2" style={{ color: 'var(--text-muted)' }}>{text.shell.noMatches}</p>
              ) : paletteResults.map(group => (
                <div key={group.label}>
                  <p className="text-[10px] font-bold uppercase px-3 py-1" style={{ color: 'var(--text-faint)' }}>{group.label}</p>
                  <div className="space-y-1">
                    {group.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => { setCommandOpen(false); setSearch(''); navigate(item.path) }}
                        className="w-full text-left rounded-xl px-3 py-3 transition-colors"
                        style={{ color: 'var(--text)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <p className="text-[12px] font-semibold">{highlightText(item.title, search)}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{highlightText(item.subtitle, search)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <header
        className="h-14 flex items-center justify-between px-3 sm:px-4 lg:px-6 shrink-0 gap-3"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
      >
      {/* Page Title */}
      <div className="animate-fade-in flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          aria-label="Open menu"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="text-[14px] sm:text-[15px] font-bold leading-none truncate" style={{ color: 'var(--text)' }}>{meta.title}</h1>
          <p className="hidden sm:block text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-faint)' }}>{meta.subtitle}</p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Search */}
        <div
          ref={searchRef}
          className="hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5 cursor-text"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', minWidth: 180, position: 'relative' }}
          onClick={() => document.getElementById('topbar-search')?.focus()}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-faint)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            id="topbar-search"
            value={search}
            onChange={e => {
              const value = e.target.value
              setSearch(value)
              setSearchOpen(Boolean(value.trim()))
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder={text.shell.search}
            className="bg-transparent text-[12px] outline-none flex-1"
            style={{ color: 'var(--text)', caretColor: 'var(--accent)', textAlign: isRtl ? 'right' : 'left' }}
            dir={isRtl ? 'rtl' : 'ltr'}
          />
          <kbd className="text-[9px] border rounded px-1 py-0.5" style={{ color: 'var(--text-faint)', borderColor: 'var(--border)' }}>Ctrl+K</kbd>
          {searchOpen && search.trim() && (
            <div
              className="absolute top-11 right-0 w-[min(92vw,340px)] rounded-xl p-2 shadow-2xl z-50"
              style={{ background: 'var(--surface-2, #1C1F27)', border: '1px solid var(--border)' }}
            >
              {resultGroups.every(group => group.items.length === 0) ? (
                <p className="text-[12px] px-3 py-2" style={{ color: 'var(--text-muted)' }}>{text.shell.noResults}</p>
              ) : (
                resultGroups.map(group => group.items.length > 0 && (
                  <div key={group.key} className="mb-2 last:mb-0">
                    <p className="text-[10px] font-bold uppercase px-3 py-1" style={{ color: 'var(--text-faint)' }}>{group.label}</p>
                    {group.items.map(item => (
                      <button
                        key={`${group.key}-${item.id}`}
                        onClick={() => navigate(group.key === 'students' ? (isStudent ? '/students/me' : `/students/${item.id}`) : group.path)}
                        className="block w-full text-left rounded-lg px-3 py-2 transition-colors"
                        style={{ color: 'var(--text)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <p className="text-[12px] font-semibold">{highlightText(item.title, search)}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{highlightText(item.subtitle, search)}</p>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
        <button
          className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-all"
          style={{ color: 'var(--text-muted)' }}
          onClick={() => { void handleNotificationsToggle() }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent';             e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-400 rounded-full" />}
        </button>
        {notificationsOpen && (
          <div
            className="absolute right-0 top-11 w-[min(92vw,360px)] rounded-xl p-2 shadow-2xl z-50 animate-scale-in"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>{text.shell.notifications}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{text.shell.notificationsSubtitle}</p>
            </div>
            <div className="max-h-[360px] overflow-y-auto py-2 space-y-1">
              {notifications.length === 0 ? (
                <p className="text-[12px] px-3 py-2" style={{ color: 'var(--text-muted)' }}>{text.shell.noAlerts}</p>
              ) : notifications.map(item => (
                <button
                  key={`${item.title}-${item.path}`}
                  onClick={() => { setNotificationsOpen(false); navigate(item.path) }}
                  className="w-full text-left rounded-lg px-3 py-3 transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[12px] font-bold"
                      style={{
                        background: item.type === 'danger' ? 'rgba(248,113,113,0.12)' : item.type === 'warning' ? 'rgba(251,191,36,0.12)' : 'rgba(96,165,250,0.12)',
                        color: item.type === 'danger' ? '#f87171' : item.type === 'warning' ? '#fbbf24' : '#60a5fa',
                      }}
                    >
                      {item.icon === 'risk' ? '!' : item.icon === 'warning' ? '!' : item.icon === 'payment' ? '$' : item.icon === 'attendance' ? '%' : '@'}
                    </span>
                    <div>
                      <p className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>{localizeNotificationText(item.title, isRtl ? 'ar' : 'en')}</p>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{localizeNotificationText(item.description, isRtl ? 'ar' : 'en')}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        </div>

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
                {text.shell.signOut}
              </button>
            </div>
          )}
        </div>
      </div>
      </header>
    </>
  )
}

function Layout() {
  const { isRtl } = useLocale()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    if (!mobileSidebarOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileSidebarOpen])

  return (
    <div className={`app-shell flex h-[100dvh] min-h-screen overflow-hidden ${isRtl ? 'flex-row-reverse' : ''}`} style={{ background: 'var(--bg)' }}>
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      {mobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close menu overlay"
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6" style={{ background: 'var(--bg)' }}>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/"           element={<Dashboard />} />
              <Route path="/students"   element={<RoleRoute allowed={['ADMIN', 'TEACHER']}><Students /></RoleRoute>} />
              <Route path="/students/me" element={<RoleRoute allowed={['STUDENT']}><StudentProfile /></RoleRoute>} />
              <Route path="/students/:id" element={<RoleRoute allowed={['ADMIN', 'TEACHER']}><StudentProfile /></RoleRoute>} />
              <Route path="/teachers"   element={<RoleRoute allowed={['ADMIN', 'TEACHER']}><Teachers /></RoleRoute>} />
              <Route path="/attendance" element={<RoleRoute allowed={['ADMIN', 'TEACHER']}><Attendance /></RoleRoute>} />
              <Route path="/calendar"   element={<Calendar />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/payments"   element={<Payments />} />
              <Route path="/reports"    element={<RoleRoute allowed={['ADMIN', 'TEACHER']}><Reports /></RoleRoute>} />
              <Route path="/teacher-performance" element={<RoleRoute allowed={['ADMIN', 'TEACHER']}><TeacherPerformance /></RoleRoute>} />
              <Route path="/gradebook" element={<RoleRoute allowed={['ADMIN', 'TEACHER']}><Gradebook /></RoleRoute>} />
              <Route path="/communications" element={<Communications />} />
              <Route path="/parents" element={<RoleRoute allowed={['ADMIN']}><Parents /></RoleRoute>} />
              <Route path="/audit-log" element={<RoleRoute allowed={['ADMIN']}><AuditLog /></RoleRoute>} />
              <Route path="/transcripts" element={<RoleRoute allowed={['ADMIN', 'TEACHER', 'STUDENT']}><Transcripts /></RoleRoute>} />
            </Routes>
          </Suspense>
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
        <LocaleProvider>
          <AuthProvider>
            <ToastContainer />
            <Suspense fallback={<RouteFallback />}>
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
            </Suspense>
          </AuthProvider>
        </LocaleProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App

function highlightText(text: string, query: string) {
  if (!query) return text
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1) return text
  const before = text.slice(0, index)
  const match = text.slice(index, index + query.length)
  const after = text.slice(index + query.length)
  return (
    <>
      {before}
      <span style={{ color: '#a78bfa' }}>{match}</span>
      {after}
    </>
  )
}
