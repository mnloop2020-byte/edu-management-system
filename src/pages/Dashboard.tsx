import { useState, useEffect } from 'react'
import { isAxiosError } from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { useNavigate } from 'react-router-dom'
import api from '../api/api'
import { SkeletonCard, SkeletonTable } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

interface Stats {
  students: number
  teachers: number
  attendanceRate: number
  pendingPayments: number
}

interface ChartTooltipPayloadItem {
  value: number | string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: ChartTooltipPayloadItem[]
  label?: string
}

interface RecentStudent {
  id: number
  name: string
  course: string | null
  grade: string | null
  status: string
}

interface WeeklyPoint {
  day: string
  students: number
}

interface TrendPoint {
  month: string
  value: number
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--surface-2,#1C1F27)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 14px', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
        <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14 }}>{payload[0].value}</p>
      </div>
    )
  }
  return null
}

const statCards = (stats: Stats) => [
  {
    title: 'Total Students',
    value: stats.students,
    trend: '+12%',
    trendUp: true,
    accent: '#7c3aed',
    bg: 'rgba(124,58,237,0.12)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    title: 'Total Teachers',
    value: stats.teachers,
    trend: '+3%',
    trendUp: true,
    accent: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    title: 'Attendance Today',
    value: `${stats.attendanceRate}%`,
    trend: stats.attendanceRate >= 85 ? 'Good' : 'Low',
    trendUp: stats.attendanceRate >= 85,
    accent: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    title: 'Pending Payments',
    value: stats.pendingPayments,
    trend: stats.pendingPayments > 0 ? 'Action needed' : 'All clear',
    trendUp: stats.pendingPayments === 0,
    accent: '#f87171',
    bg: 'rgba(248,113,113,0.12)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
]

const avatarColors = [
  'from-violet-500 to-indigo-600', 'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',  'from-amber-400 to-orange-500',
]
const gradeStyle: Record<string, string> = {
  'A+': 'badge-success', 'A': 'badge-success', 'A−': 'badge-success',
  'B+': 'badge-info',    'B': 'badge-info',
  'C+': 'badge-warning', 'C': 'badge-warning',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats,          setStats]          = useState<Stats>({ students: 0, teachers: 0, attendanceRate: 0, pendingPayments: 0 })
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([])
  const [weekData,       setWeekData]       = useState<WeeklyPoint[]>([])
  const [trendData,      setTrendData]      = useState<TrendPoint[]>([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      setLoading(true); setError('')
      const res = await api.get('/dashboard')
      setStats(res.data.stats ?? { students: 0, teachers: 0, attendanceRate: 0, pendingPayments: 0 })
      setRecentStudents(res.data.recentStudents ?? [])
      setWeekData(res.data.weekly ?? [])
      setTrendData(res.data.trend ?? [])
    } catch (err: unknown) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message || 'Failed to load dashboard data'
          : 'Failed to load dashboard data'
      )
    } finally {
      setLoading(false)
    }
  }

  const cards = statCards(stats)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 animate-fade-in" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-[13px]" style={{ color: '#f87171', flex: 1 }}>{error}</p>
          <button onClick={fetchData} className="text-[12px] underline" style={{ color: '#f87171' }}>Retry</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : cards.map(card => (
              <div
                key={card.title}
                className="card card-glow p-5 group cursor-default animate-slide-up"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: card.bg, color: card.accent }}
                  >
                    {card.icon}
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: card.trendUp ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)',
                      color:      card.trendUp ? '#10b981'              : '#f87171',
                    }}
                  >
                    {card.trendUp ? '↑' : '↓'} {card.trend}
                  </span>
                </div>
                <p className="text-[30px] font-extrabold leading-none tracking-tight" style={{ color: 'var(--text)' }}>
                  {card.value}
                </p>
                <p className="text-[12px] mt-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>{card.title}</p>
              </div>
            ))
        }
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Weekly Attendance Bar Chart */}
        <div className="xl:col-span-2 card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>Weekly Attendance</h2>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Students present per day</p>
            </div>
            <div
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
              style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa' }}
            >
              This week
            </div>
          </div>
          {loading ? (
            <div className="skeleton rounded-xl" style={{ height: 220 }} />
          ) : weekData.length === 0 ? (
            <EmptyState title="No data yet" message="Attendance data will appear here once recorded." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="students" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Enrollment Trend */}
        <div className="card p-5 animate-slide-up" style={{ animationDelay: '80ms' }}>
          <div className="mb-4">
            <h2 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>Enrollment Trend</h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Last 6 months</p>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-[34px] font-extrabold leading-none tracking-tight" style={{ color: 'var(--text)' }}>{stats.students}</span>
            <span className="text-[12px] font-semibold" style={{ color: '#10b981' }}>students</span>
          </div>
          {loading ? (
            <div className="skeleton rounded-xl" style={{ height: 140 }} />
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2.5} fill="url(#areaGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Students Table */}
      <div className="card overflow-hidden animate-slide-up" style={{ animationDelay: '120ms' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>Recent Students</h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Latest enrollments</p>
          </div>
          <button
            onClick={() => navigate('/students')}
            className="text-[12px] font-semibold transition-colors flex items-center gap-1"
            style={{ color: '#a78bfa' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c4b5fd')}
            onMouseLeave={e => (e.currentTarget.style.color = '#a78bfa')}
          >
            View all
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Student', 'Course', 'Grade', 'Status'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={4} cols={4} />
            ) : recentStudents.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState title="No students yet" message="Students will appear here after enrollment." />
                </td>
              </tr>
            ) : (
              recentStudents.map((s, i) => (
                <tr
                  key={s.id}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                        {s.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-[13px]" style={{ color: 'var(--text-muted)' }}>{s.course ?? '—'}</td>
                  <td className="px-6 py-3.5">
                    {s.grade
                      ? <span className={`badge ${gradeStyle[s.grade] || 'badge-info'}`}>{s.grade}</span>
                      : <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>—</span>
                    }
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.status === 'Active' ? '#10b981' : '#fbbf24' }} />
                      <span className="text-[12px] font-medium" style={{ color: s.status === 'Active' ? '#10b981' : '#fbbf24' }}>{s.status}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
