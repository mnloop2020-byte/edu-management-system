import { useState, useEffect } from 'react'
import api from '../api/api'

interface Student {
  id: number
  name: string
  course: string
  grade: string | null
  status: string
  joinedAt: string
}

interface Analysis {
  student: { id: number; name: string; course: string; grade: string | null; status: string }
  stats: {
    attendanceRate: number
    presentCount: number
    absentCount: number
    lateCount: number
    paidPayments: number
    pendingPayments: number
    overduePayments: number
  }
  analysis: string
}

const avatarColors = [
  'from-violet-500 to-indigo-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-pink-500 to-rose-600',
  'from-teal-400 to-cyan-600',
]

const gradeStyle: Record<string, string> = {
  'A+': 'text-emerald-400 bg-emerald-500/10',
  'A':  'text-emerald-400 bg-emerald-500/10',
  'A−': 'text-emerald-400 bg-emerald-500/10',
  'B+': 'text-blue-400 bg-blue-500/10',
  'B':  'text-blue-400 bg-blue-500/10',
  'B−': 'text-blue-400 bg-blue-500/10',
  'C+': 'text-amber-400 bg-amber-500/10',
  'C':  'text-amber-400 bg-amber-500/10',
}

const statusStyle: Record<string, { dot: string; text: string }> = {
  'Active':    { dot: 'bg-emerald-400', text: 'text-emerald-400' },
  'On Leave':  { dot: 'bg-amber-400',   text: 'text-amber-400' },
  'Suspended': { dot: 'bg-red-400',     text: 'text-red-400' },
}

const courses = ['All', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology']

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin text-violet-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  )
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', course: '', grade: '', status: 'Active' })
  const [saving, setSaving] = useState(false)

  // AI Analysis
  const [analysisModal, setAnalysisModal] = useState(false)
  const [analysisData, setAnalysisData] = useState<Analysis | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  useEffect(() => { fetchStudents() }, [])

  async function fetchStudents() {
    try {
      setLoading(true)
      const res = await api.get('/students')
      setStudents(res.data.students)
    } catch {
      setError('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyze(id: number) {
    setAnalysisData(null)
    setAnalysisModal(true)
    setAnalysisLoading(true)
    try {
      const res = await api.get(`/ai/analyze/${id}`)
      setAnalysisData(res.data)
    } catch {
      alert('Failed to analyze student')
      setAnalysisModal(false)
    } finally {
      setAnalysisLoading(false)
    }
  }

  async function handleAdd() {
    if (!form.name || !form.course) return
    setSaving(true)
    try {
      await api.post('/students', form)
      await fetchStudents()
      setShowModal(false)
      setForm({ name: '', course: '', grade: '', status: 'Active' })
    } catch {
      alert('Failed to add student')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this student?')) return
    try {
      await api.delete(`/students/${id}`)
      setStudents(prev => prev.filter(s => s.id !== id))
    } catch {
      alert('Failed to delete student')
    }
  }

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    const matchCourse = courseFilter === 'All' || s.course === courseFilter
    const matchStatus = statusFilter === 'All' || s.status === statusFilter
    return matchSearch && matchCourse && matchStatus
  })

  if (loading) return <Spinner />
  if (error) return <div className="flex items-center justify-center h-64"><p className="text-red-400 text-[13px]">{error}</p></div>

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-[#111318] border border-white/[0.06] rounded-xl px-4 py-2 flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..."
              className="bg-transparent text-[13px] text-white/80 placeholder:text-white/25 outline-none w-48" />
          </div>
          <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
            className="bg-[#111318] border border-white/[0.06] rounded-xl px-3 py-2 text-[13px] text-white/60 outline-none cursor-pointer">
            {courses.map(c => <option key={c} value={c} className="bg-[#111318]">{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#111318] border border-white/[0.06] rounded-xl px-3 py-2 text-[13px] text-white/60 outline-none cursor-pointer">
            {['All', 'Active', 'On Leave', 'Suspended'].map(s => <option key={s} value={s} className="bg-[#111318]">{s}</option>)}
          </select>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 transition-colors text-white text-[13px] font-medium px-4 py-2 rounded-xl">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Student
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: students.length,                                       color: 'text-white' },
          { label: 'Active',    value: students.filter(s => s.status === 'Active').length,     color: 'text-emerald-400' },
          { label: 'On Leave',  value: students.filter(s => s.status === 'On Leave').length,   color: 'text-amber-400' },
          { label: 'Suspended', value: students.filter(s => s.status === 'Suspended').length,  color: 'text-red-400' },
        ].map(item => (
          <div key={item.label} className="bg-[#111318] border border-white/[0.06] rounded-2xl px-5 py-4 flex items-center justify-between">
            <span className="text-[12px] text-white/40">{item.label}</span>
            <span className={`text-[22px] font-bold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.06]">
          <p className="text-[12px] text-white/35">{filtered.length} students found</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {['Student', 'Course', 'Grade', 'Status', 'Joined', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                      {getInitials(s.name)}
                    </div>
                    <span className="text-[13px] text-white/85 font-medium">{s.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-[13px] text-white/40">{s.course}</td>
                <td className="px-5 py-3.5">
                  {s.grade
                    ? <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${gradeStyle[s.grade] || 'text-white/40 bg-white/[0.06]'}`}>{s.grade}</span>
                    : <span className="text-[12px] text-white/20">—</span>}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusStyle[s.status]?.dot || 'bg-white/30'}`} />
                    <span className={`text-[12px] ${statusStyle[s.status]?.text || 'text-white/50'}`}>{s.status}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-[12px] text-white/30">
                  {new Date(s.joinedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleAnalyze(s.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                      title="AI Analysis">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                    </button>
                    <button onClick={() => handleDelete(s.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-[13px] text-white/25">No students found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#111318] border border-white/[0.08] rounded-2xl w-[400px] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h2 className="text-[14px] font-semibold text-white">Add Student</h2>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {[
                { label: 'Full Name *', key: 'name',   placeholder: 'Student name' },
                { label: 'Course *',    key: 'course', placeholder: 'e.g. Mathematics' },
                { label: 'Grade',       key: 'grade',  placeholder: 'e.g. A, B+' },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-white/40 font-medium">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-[13px] text-white/80 placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors" />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-white/40 font-medium">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-[13px] text-white/80 outline-none focus:border-violet-500/50 transition-colors">
                  {['Active', 'On Leave', 'Suspended'].map(s => <option key={s} value={s} className="bg-[#111318]">{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-[13px] text-white/50 border border-white/[0.08] rounded-xl">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="px-4 py-2 text-[13px] font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl transition-colors">
                {saving ? 'Adding...' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {analysisModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#111318] border border-white/[0.08] rounded-2xl w-[580px] max-h-[80vh] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <h2 className="text-[14px] font-semibold text-white">
                  {analysisData ? `تحليل أداء ${analysisData.student.name}` : 'جاري التحليل...'}
                </h2>
              </div>
              <button onClick={() => setAnalysisModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {analysisLoading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <svg className="animate-spin text-violet-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <p className="text-[13px] text-white/40">يتم تحليل بيانات الطالب...</p>
                </div>
              ) : analysisData && (
                <div className="p-6 space-y-5">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/[0.03] rounded-xl px-4 py-3 text-center">
                      <p className="text-[22px] font-bold text-emerald-400">{analysisData.stats.attendanceRate}%</p>
                      <p className="text-[11px] text-white/35 mt-0.5">نسبة الحضور</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl px-4 py-3 text-center">
                      <p className="text-[22px] font-bold text-blue-400">{analysisData.stats.paidPayments}</p>
                      <p className="text-[11px] text-white/35 mt-0.5">دفعات مسددة</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl px-4 py-3 text-center">
                      <p className="text-[22px] font-bold text-amber-400">{analysisData.stats.absentCount}</p>
                      <p className="text-[11px] text-white/35 mt-0.5">أيام غياب</p>
                    </div>
                  </div>

                  {/* Analysis Text */}
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                    <p className="text-[12px] text-white/40 mb-3 flex items-center gap-1.5">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/></svg>
                      تحليل الذكاء الاصطناعي
                    </p>
                    <div className="text-[13px] text-white/70 leading-7 whitespace-pre-wrap text-right" dir="rtl">
                      {analysisData.analysis}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => setAnalysisModal(false)} className="w-full px-4 py-2 text-[13px] text-white/50 border border-white/[0.08] rounded-xl hover:border-white/[0.15] transition-colors">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}