import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { useNavigate } from 'react-router-dom'
import api from '../api/api'

interface Stats {
  students: number
  teachers: number
  attendanceRate: number
  pendingPayments: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1C1F27] border border-white/[0.08] rounded-xl px-3 py-2 text-[12px] shadow-xl">
        <p className="text-white/40 mb-1">{label}</p>
        <p className="text-white font-semibold">{payload[0].value}</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ students: 0, teachers: 0, attendanceRate: 0, pendingPayments: 0 })
  const [recentStudents, setRecentStudents] = useState<any[]>([])
  const [weekData, setWeekData] = useState<any[]>([])
  const [trendData, setTrendData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      setLoading(true)
      setError('')
      const res = await api.get('/dashboard')
      setStats(res.data.stats ?? { students: 0, teachers: 0, attendanceRate: 0, pendingPayments: 0 })
      setRecentStudents(res.data.recentStudents ?? [])
      setWeekData(res.data.weekly ?? [])
      setTrendData(res.data.trend ?? [])

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const avatarColors = [
    'from-violet-500 to-indigo-600', 'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',  'from-amber-400 to-orange-500',
  ]

  const gradeStyle: Record<string, string> = {
    'A+': 'text-emerald-400 bg-emerald-500/10', 'A': 'text-emerald-400 bg-emerald-500/10',
    'A−': 'text-emerald-400 bg-emerald-500/10', 'B+': 'text-blue-400 bg-blue-500/10',
    'B':  'text-blue-400 bg-blue-500/10',        'C+': 'text-amber-400 bg-amber-500/10',
  }

  const statCards = [
    { title: 'Total Students',   value: stats.students,             accent: 'text-violet-400 bg-violet-500/10',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { title: 'Total Teachers',   value: stats.teachers,             accent: 'text-blue-400 bg-blue-500/10',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { title: 'Attendance Today', value: `${stats.attendanceRate}%`, accent: 'text-emerald-400 bg-emerald-500/10',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
    { title: 'Pending Payments', value: stats.pendingPayments,      accent: 'text-red-400 bg-red-500/10',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  ]

  return (
    <div className="space-y-5">

      {error && (
        <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" className="shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-[12px] text-red-400">{error}</p>
          <button onClick={fetchData} className="ml-auto text-[11px] text-red-400 hover:text-red-300 underline">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(stat => (
          <div key={stat.title} className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-4 hover:border-white/[0.1] transition-colors">
            <div className="flex items-center justify-between">
              <span className={`w-8 h-8 rounded-lg ${stat.accent} flex items-center justify-center`}>{stat.icon}</span>
            </div>
            <div>
              <p className="text-[28px] font-bold text-white leading-none tracking-tight">
                {loading
                  ? <span className="inline-block w-16 h-7 bg-white/[0.05] rounded animate-pulse" />
                  : stat.value}
              </p>
              <p className="text-[12px] text-white/40 mt-1">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[14px] font-semibold text-white">Weekly Attendance</h2>
              <p className="text-[11px] text-white/35 mt-0.5">Students present per day</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="students" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
          <div className="mb-5">
            <h2 className="text-[14px] font-semibold text-white">Enrollment Trend</h2>
            <p className="text-[11px] text-white/35 mt-0.5">Last 6 months</p>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-[32px] font-bold text-white leading-none">{stats.students}</span>
            <span className="text-[12px] text-emerald-400 font-medium">students</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2} fill="url(#grad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-[14px] font-semibold text-white">Recent Students</h2>
            <p className="text-[11px] text-white/35 mt-0.5">Latest enrollments</p>
          </div>
          <button
            onClick={() => navigate('/students')}
            className="text-[12px] text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            View all →
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {['Student', 'Course', 'Grade', 'Status'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-white/[0.05] rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              : recentStudents.map((s, i) => (
                  <tr key={s.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                          {s.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[13px] text-white/85 font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-white/40">{s.course ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      {s.grade
                        ? <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${gradeStyle[s.grade] || 'text-white/40 bg-white/[0.06]'}`}>{s.grade}</span>
                        : <span className="text-[12px] text-white/20">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span className={`text-[12px] ${s.status === 'Active' ? 'text-emerald-400' : 'text-amber-400'}`}>{s.status}</span>
                      </div>
                    </td>
                  </tr>
                ))
            }
            {!loading && recentStudents.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-[13px] text-white/25">No students yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
