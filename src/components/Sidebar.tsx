import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    badge: null,
  },
  {
    path: '/students',
    label: 'Students',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    badge: '124',
  },
  {
    path: '/teachers',
    label: 'Teachers',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    badge: '18',
  },
  {
    path: '/attendance',
    label: 'Attendance',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M9 16l2 2 4-4" />
      </svg>
    ),
    badge: null,
  },
  {
    path: '/payments',
    label: 'Payments',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    badge: '12',
    badgeAlert: true,
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    badge: null,
  },
]

export default function Sidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <aside
      className="relative flex flex-col shrink-0 h-full border-r border-white/[0.06] bg-[#111318] transition-all duration-300 ease-in-out"
      style={{ width: collapsed ? 60 : 220 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-[18px] border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </div>
        {!collapsed && (
          <div>
            <p className="text-[13px] font-semibold text-white tracking-tight leading-none">EduSystem</p>
            <p className="text-[10px] text-white/35 mt-0.5 tracking-widest uppercase">Management</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[70px] w-6 h-6 rounded-full bg-[#1C1F27] border border-white/[0.1] flex items-center justify-center text-white/40 hover:text-white/80 hover:border-white/20 transition-all z-20"
      >
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-[7px] cursor-pointer hover:bg-white/[0.07] transition-colors group">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30 shrink-0">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="text-[12px] text-white/30 flex-1">Search...</span>
            <kbd className="text-[9px] text-white/20 border border-white/[0.08] rounded px-1 py-0.5">⌘K</kbd>
          </div>
        </div>
      )}

      {/* Section label */}
      {!collapsed && (
        <p className="px-4 pt-2 pb-1 text-[9px] font-semibold text-white/20 uppercase tracking-[0.12em]">
          Navigation
        </p>
      )}

      {/* Nav Links */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const isHov = hovered === item.path

          return (
            <div key={item.path} className="relative">
              <Link
                to={item.path}
                onMouseEnter={() => setHovered(item.path)}
                onMouseLeave={() => setHovered(null)}
                className={`flex items-center gap-3 px-3 py-[9px] rounded-lg transition-all duration-150 relative ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-violet-600/[0.18] text-violet-300'
                    : 'text-white/45 hover:text-white/85 hover:bg-white/[0.05]'
                }`}
              >
                {/* Active bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-violet-400 rounded-r-full" />
                )}

                <span className={`shrink-0 transition-colors ${isActive ? 'text-violet-400' : 'text-white/35'}`}>
                  {item.icon}
                </span>

                {!collapsed && (
                  <>
                    <span className="text-[13px] font-medium flex-1 whitespace-nowrap">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium tabular-nums ${
                        item.badgeAlert
                          ? 'bg-red-500/20 text-red-400'
                          : isActive
                          ? 'bg-violet-500/25 text-violet-300'
                          : 'bg-white/[0.07] text-white/30'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>

              {/* Tooltip when collapsed */}
              {collapsed && isHov && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-[#1C1F27] border border-white/[0.1] rounded-lg text-[12px] text-white/90 whitespace-nowrap z-50 shadow-xl pointer-events-none">
                  {item.label}
                  {item.badge && (
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      item.badgeAlert ? 'text-red-400' : 'text-white/40'
                    }`}>{item.badge}</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-white/[0.06]" />

      {/* Bottom: User */}
      <div className="px-2 py-3">
        <div
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 text-[10px] font-bold text-white select-none">
            AH
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-white/80 truncate leading-none">Ahmed Hassan</p>
                <p className="text-[10px] text-white/30 truncate mt-0.5">Administrator</p>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20 shrink-0">
                <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
              </svg>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
