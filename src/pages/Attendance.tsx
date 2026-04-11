import { useState, useEffect } from 'react'
import api from '../api/api'

interface Student { id: number; name: string; course: string }
interface AttendanceRecord { studentId: number; status: string }

type Status = 'present' | 'absent' | 'late'

const avatarColors = [
  'from-violet-500 to-indigo-600', 'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',  'from-amber-400 to-orange-500',
  'from-pink-500 to-rose-600',
]

const statusConfig: Record<Status, { label: string; active: string; dot: string; text: string }> = {
  present: { label: 'Present', active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20', dot: 'bg-emerald-400', text: 'text-emerald-400' },
  absent:  { label: 'Absent',  active: 'bg-red-500/15 text-red-400 border border-red-500/20',             dot: 'bg-red-400',     text: 'text-red-400' },
  late:    { label: 'Late',    active: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',       dot: 'bg-amber-400',   text: 'text-amber-400' },
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function Attendance() {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<number, Status>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [studentsRes, attendanceRes] = await Promise.all([
        api.get('/students'),
        api.get('/attendance'),
      ])
      const studentList: Student[] = studentsRes.data.students
      setStudents(studentList)

      const records: AttendanceRecord[] = attendanceRes.data.records
      const map: Record<number, Status> = {}
      studentList.forEach(s => { map[s.id] = 'present' })
      records.forEach(r => { map[r.studentId] = r.status as Status })
      setAttendance(map)
    } finally {
      setLoading(false)
    }
  }

  async function handleMark(studentId: number, status: Status) {
    setAttendance(prev => ({ ...prev, [studentId]: status }))
    setSaving(studentId)
    try {
      await api.post('/attendance', { studentId, status })
    } catch {
      alert('Failed to save attendance')
    } finally {
      setSaving(null)
    }
  }

  const counts = {
    present: Object.values(attendance).filter(s => s === 'present').length,
    absent:  Object.values(attendance).filter(s => s === 'absent').length,
    late:    Object.values(attendance).filter(s => s === 'late').length,
  }
  const rate = students.length ? Math.round((counts.present / students.length) * 100) : 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin text-violet-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Date bar */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-white/80">Today's Attendance</p>
            <p className="text-[11px] text-white/35 mt-0.5">{today}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Attendance Rate', value: `${rate}%`, color: rate >= 90 ? 'text-emerald-400' : 'text-amber-400' },
          { label: 'Present', value: counts.present, color: 'text-emerald-400' },
          { label: 'Absent',  value: counts.absent,  color: 'text-red-400' },
          { label: 'Late',    value: counts.late,    color: 'text-amber-400' },
        ].map(item => (
          <div key={item.label} className="bg-[#111318] border border-white/[0.06] rounded-2xl px-5 py-4 flex items-center justify-between">
            <span className="text-[12px] text-white/40">{item.label}</span>
            <span className={`text-[22px] font-bold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[12px] text-white/40">Attendance breakdown</span>
          <span className="text-[12px] text-white/60 font-medium">{students.length} students total</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${students.length ? (counts.present / students.length) * 100 : 0}%` }} />
          <div className="bg-amber-500 transition-all duration-500"  style={{ width: `${students.length ? (counts.late    / students.length) * 100 : 0}%` }} />
          <div className="bg-red-500 transition-all duration-500"    style={{ width: `${students.length ? (counts.absent  / students.length) * 100 : 0}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-2.5">
          {[{ label: 'Present', color: 'bg-emerald-500' }, { label: 'Late', color: 'bg-amber-500' }, { label: 'Absent', color: 'bg-red-500' }].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${l.color}`} />
              <span className="text-[11px] text-white/35">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.06]">
          <p className="text-[13px] font-medium text-white/60">Student List</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {['Student', 'Course', 'Status', 'Action'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const current = attendance[s.id] || 'present'
              return (
                <tr key={s.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                        {getInitials(s.name)}
                      </div>
                      <span className="text-[13px] text-white/85 font-medium">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-white/40">{s.course}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {saving === s.id
                        ? <svg className="animate-spin text-white/30" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        : <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[current].dot}`} />
                      }
                      <span className={`text-[12px] ${statusConfig[current].text}`}>{statusConfig[current].label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      {(['present', 'absent', 'late'] as Status[]).map(st => (
                        <button key={st} onClick={() => handleMark(s.id, st)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                            current === st ? statusConfig[st].active : 'text-white/25 hover:text-white/60 border border-white/[0.06] hover:border-white/[0.1]'
                          }`}>
                          {statusConfig[st].label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
