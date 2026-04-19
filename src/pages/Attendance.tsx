import { useState, useEffect } from 'react'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/ui/Toast'

interface Student { id: number; name: string; course: string }
interface AttendanceRecord { studentId: number; status: string }
type Status = 'present' | 'absent' | 'late'

const avatarColors = [
  'from-violet-500 to-indigo-600', 'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',  'from-amber-400 to-orange-500',
  'from-pink-500 to-rose-600',
]
function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const statusConfig: Record<Status, { label: string; color: string; bg: string; border: string; dot: string }> = {
  present: { label: 'Present', color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  dot: '#10b981' },
  absent:  { label: 'Absent',  color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)', dot: '#f87171' },
  late:    { label: 'Late',    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)',  dot: '#fbbf24' },
}

export default function Attendance() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const [students,   setStudents]   = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<number, Status>>({})
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState<number | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [studentsRes, attendanceRes] = await Promise.all([api.get('/students'), api.get('/attendance')])
      const studentList: Student[] = studentsRes.data.students
      setStudents(studentList)
      const records: AttendanceRecord[] = attendanceRes.data.records
      const map: Record<number, Status> = {}
      studentList.forEach(s => { map[s.id] = 'present' })
      records.forEach(r => { map[r.studentId] = r.status as Status })
      setAttendance(map)
    } finally { setLoading(false) }
  }

  async function handleMark(studentId: number, status: Status) {
    if (!isAdmin) return
    const prev = attendance[studentId] || 'present'
    setAttendance(p => ({ ...p, [studentId]: status }))
    setSaving(studentId)
    try {
      await api.post('/attendance', { studentId, status })
    } catch {
      setAttendance(p => ({ ...p, [studentId]: prev }))
      toast.error('Failed to save attendance')
    } finally { setSaving(null) }
  }

  const counts = {
    present: Object.values(attendance).filter(s => s === 'present').length,
    absent:  Object.values(attendance).filter(s => s === 'absent').length,
    late:    Object.values(attendance).filter(s => s === 'late').length,
  }
  const rate = students.length ? Math.round((counts.present / students.length) * 100) : 0

  const summaryStats = [
    { label: 'Rate',    value: `${rate}%`,      color: rate >= 90 ? '#10b981' : '#fbbf24' },
    { label: 'Present', value: counts.present,  color: '#10b981' },
    { label: 'Absent',  value: counts.absent,   color: '#f87171' },
    { label: 'Late',    value: counts.late,      color: '#fbbf24' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Date bar */}
      <div className="card px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.12)', color: '#a78bfa' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/>
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>Today's Attendance</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{today}</p>
          </div>
        </div>
        {!isAdmin && (
          <span className="text-[11px] px-3 py-1 rounded-full" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
            View only
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 stagger">
        {summaryStats.map(item => (
          <div key={item.label} className="card px-5 py-4 flex items-center justify-between animate-slide-up">
            <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
            <span className="text-[22px] font-extrabold" style={{ color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card px-5 py-4 animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Attendance breakdown</span>
          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{students.length} students total</span>
        </div>
        <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
          <div className="rounded-full transition-all duration-700" style={{ width: `${students.length ? (counts.present / students.length) * 100 : 0}%`, background: '#10b981' }} />
          <div className="rounded-full transition-all duration-700" style={{ width: `${students.length ? (counts.late    / students.length) * 100 : 0}%`, background: '#fbbf24' }} />
          <div className="rounded-full transition-all duration-700" style={{ width: `${students.length ? (counts.absent  / students.length) * 100 : 0}%`, background: '#f87171' }} />
        </div>
        <div className="flex items-center gap-4 mt-2.5">
          {[
            { label: 'Present', color: '#10b981' },
            { label: 'Late',    color: '#fbbf24' },
            { label: 'Absent',  color: '#f87171' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Student Table */}
      <div className="card overflow-hidden animate-slide-up">
        <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Student List</p>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Student', 'Course', 'Status', isAdmin ? 'Mark Attendance' : ''].filter(Boolean).map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    {[140, 90, 80, 200].map((w, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="skeleton" style={{ width: w, height: 14 }} />
                      </td>
                    ))}
                  </tr>
                ))
              : students.map((s, i) => {
                  const current = attendance[s.id] || 'present'
                  const sc = statusConfig[current]
                  return (
                    <tr key={s.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                            {getInitials(s.name)}
                          </div>
                          <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{s.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[13px]" style={{ color: 'var(--text-muted)' }}>{s.course}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {saving === s.id
                            ? <div className="w-3 h-3 border border-white/30 border-t-transparent rounded-full animate-spin" />
                            : <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                          }
                          <span className="text-[12px] font-semibold" style={{ color: sc.color }}>{sc.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          {(['present', 'absent', 'late'] as Status[]).map(st => {
                            const c = statusConfig[st]
                            const isSelected = current === st
                            return (
                              <button key={st} onClick={() => handleMark(s.id, st)}
                                disabled={!isAdmin || saving === s.id}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                                style={{
                                  background: isSelected ? c.bg : 'transparent',
                                  color:      isSelected ? c.color : 'var(--text-faint)',
                                  border:     `1px solid ${isSelected ? c.border : 'var(--border)'}`,
                                  cursor:     !isAdmin ? 'not-allowed' : 'pointer',
                                  opacity:    !isAdmin ? 0.6 : 1,
                                }}
                                onMouseEnter={e => { if (isAdmin && !isSelected) { e.currentTarget.style.background = c.bg; e.currentTarget.style.color = c.color; e.currentTarget.style.borderColor = c.border } }}
                                onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.borderColor = 'var(--border)' } }}
                              >
                                {c.label}
                              </button>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
