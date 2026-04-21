import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/api'
import { useLocale } from '../hooks/useLocale'

interface Counts { students: number; teachers: number; payments: number }

const navItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    path: '/students',
    label: 'Students',
    countKey: 'students' as const,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    path: '/teachers',
    label: 'Teachers',
    countKey: 'teachers' as const,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    path: '/calendar',
    label: 'Calendar',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    path: '/assignments',
    label: 'Assignments',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    path: '/attendance',
    label: 'Attendance',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M9 16l2 2 4-4"/>
      </svg>
    ),
  },
  {
    path: '/payments',
    label: 'Payments',
    countKey: 'payments' as const,
    alert: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    path: '/automation',
    label: 'Automation',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="12" r="2"/>
        <circle cx="18" cy="6" r="2"/>
        <circle cx="18" cy="18" r="2"/>
        <path d="M8 12h4M14 12l2-4M14 12l2 6"/>
      </svg>
    ),
  },
  {
    path: '/teacher-performance',
    label: 'Performance',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10"/>
        <line x1="18" y1="20" x2="18" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    path: '/gradebook',
    label: 'Gradebook',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    path: '/communications',
    label: 'Communications',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    path: '/parents',
    label: 'Parents',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    path: '/transcripts',
    label: 'Transcripts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    path: '/audit-log',
    label: 'Audit Log',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10"/>
        <path d="M18 20V4"/>
        <path d="M6 20v-4"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const location  = useLocation()
  const { user, logout } = useAuth()
  const { text, isRtl } = useLocale()
  const [collapsed, setCollapsed] = useState(false)
  const [hovered,   setHovered]   = useState<string | null>(null)
  const [counts,    setCounts]    = useState<Counts>({ students: 0, teachers: 0, payments: 0 })
  const navLabelByPath: Record<string, string> = {
    '/': text.nav.dashboard,
    '/students': text.nav.students,
    '/teachers': text.nav.teachers,
    '/calendar': text.nav.calendar,
    '/assignments': text.nav.assignments,
    '/attendance': text.nav.attendance,
    '/payments': text.nav.payments,
    '/reports': text.nav.reports,
    '/automation': text.nav.automation,
    '/teacher-performance': text.nav.performance,
    '/gradebook': text.nav.gradebook,
    '/communications': text.nav.communications,
    '/parents': text.nav.parents,
    '/transcripts': text.nav.transcripts,
    '/audit-log': text.nav.auditLog,
  }

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  useEffect(() => {
    api.get('/dashboard').then(res => {
      setCounts({
        students: res.data.stats?.students ?? 0,
        teachers: res.data.stats?.teachers ?? 0,
        payments: res.data.stats?.pendingPayments ?? 0,
      })
    }).catch(() => {})
  }, [])

  return (
    <aside
      className="relative flex flex-col shrink-0 h-full transition-all duration-300 ease-in-out"
      style={{
        width: collapsed ? 64 : 224,
        background: 'var(--surface)',
        borderRight: isRtl ? 'none' : '1px solid var(--border)',
        borderLeft: isRtl ? '1px solid var(--border)' : 'none',
      }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center gap-3 px-4 h-14 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <p className="text-[14px] font-bold leading-none tracking-tight" style={{ color: 'var(--text)' }}>EduSystem</p>
            <p className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-faint)' }}>{text.nav.management}</p>
          </div>
        )}
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-[50px] w-6 h-6 rounded-full flex items-center justify-center z-20 transition-all hover:scale-110"
        style={{
          right: isRtl ? 'auto' : -12,
          left: isRtl ? -12 : 'auto',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
        >
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      {/* ── Search (expanded only) ── */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-2 animate-fade-in">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-faint)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span className="text-[12px]" style={{ color: 'var(--text-faint)' }}>{text.shell.search}</span>
            <kbd className="ml-auto text-[9px] border rounded px-1 py-0.5" style={{ color: 'var(--text-faint)', borderColor: 'var(--border)' }}>Ctrl+K</kbd>
          </div>
        </div>
      )}

      {/* ── Section label ── */}
      {!collapsed && (
        <p className="px-4 pt-1 pb-1 text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-faint)' }}>
          {text.nav.navigation}
        </p>
      )}

      {/* ── Nav Links ── */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto py-1">
        {navItems.map(item => {
          const isActive = location.pathname === item.path
          const badge    = item.countKey ? counts[item.countKey] : 0
          const isHov    = hovered === item.path

          return (
            <div key={item.path} className="relative">
              <Link
                to={item.path}
                onMouseEnter={() => setHovered(item.path)}
                onMouseLeave={() => setHovered(null)}
                className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150 relative group"
                style={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(79,70,229,0.12))'
                    : isHov
                    ? 'rgba(255,255,255,0.05)'
                    : 'transparent',
                  color: isActive ? '#a78bfa' : 'var(--text-muted)',
                }}
              >
                {/* Active left accent */}
                {isActive && (
                  <span
                    className="absolute top-1/2 -translate-y-1/2 w-[3px] h-5"
                    style={{
                      left: isRtl ? 'auto' : 0,
                      right: isRtl ? 0 : 'auto',
                      borderRadius: isRtl ? '999px 0 0 999px' : '0 999px 999px 0',
                      background: 'linear-gradient(to bottom, #a78bfa, #7c3aed)',
                    }}
                  />
                )}

                {/* Icon */}
                <span
                  className="shrink-0 transition-colors"
                  style={{
                    color: isActive ? '#a78bfa' : isHov ? 'var(--text)' : 'var(--text-muted)',
                    filter: isActive ? 'drop-shadow(0 0 6px rgba(167,139,250,0.5))' : 'none',
                  }}
                >
                  {item.icon}
                </span>

                {/* Label + badge */}
                {!collapsed && (
                  <>
                    <span className="text-[13px] font-medium flex-1 whitespace-nowrap" style={{ color: isActive ? '#e2e0ff' : 'var(--text-muted)' }}>
                      {navLabelByPath[item.path] || item.label}
                    </span>
                    {badge > 0 && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-md font-bold tabular-nums"
                        style={{
                          background: item.alert ? 'rgba(248,113,113,0.15)' : isActive ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.07)',
                          color:      item.alert ? '#f87171'                : isActive ? '#a78bfa'               : 'var(--text-muted)',
                        }}
                      >
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </Link>

              {/* Tooltip when collapsed */}
              {collapsed && isHov && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl text-[12px] font-medium whitespace-nowrap z-50 shadow-2xl pointer-events-none animate-scale-in"
                  style={{
                    left: isRtl ? 'auto' : '100%',
                    right: isRtl ? '100%' : 'auto',
                    marginLeft: isRtl ? 0 : 12,
                    marginRight: isRtl ? 12 : 0,
                    background: 'var(--surface-2,#1C1F27)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  {navLabelByPath[item.path] || item.label}
                  {badge > 0 && (
                    <span className="ml-2 text-[10px]" style={{ color: item.alert ? '#f87171' : 'var(--text-muted)' }}>
                      {badge}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Divider ── */}
      <div className="mx-3" style={{ borderTop: '1px solid var(--border)' }} />

      {/* ── User section ── */}
      <div className="px-2 py-3">
        <div
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all"
          style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 text-[10px] font-bold text-white select-none" style={{ boxShadow: '0 2px 8px rgba(251,191,36,0.3)' }}>
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold leading-none truncate" style={{ color: 'var(--text)' }}>{user?.name || 'User'}</p>
                <p className="text-[10px] mt-0.5 capitalize truncate" style={{ color: 'var(--text-muted)' }}>{user?.role?.toLowerCase() || 'admin'}</p>
              </div>
              <button
                onClick={logout}
                title={text.shell.signOut}
                className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--text-faint)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
