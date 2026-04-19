import { useState, useEffect, useCallback } from 'react'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/ui/Toast'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Modal } from '../components/ui/Modal'
import { SkeletonTable } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

interface Student {
  id: number; name: string; course: string
  grade: string | null; status: string; joinedAt: string
}
interface Analysis {
  student: { id: number; name: string; course: string; grade: string | null; status: string }
  stats: { attendanceRate: number; presentCount: number; absentCount: number; lateCount: number; paidPayments: number; pendingPayments: number; overduePayments: number }
  analysis: string
}

type StudentFormKey = 'name' | 'course' | 'grade'

// Unsplash student photos
const STUDENT_PHOTOS = [
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=60&q=75',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=60&q=75',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=60&q=75',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=60&q=75',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=60&q=75',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=60&q=75',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=60&q=75',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&q=75',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=60&q=75',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=60&q=75',
]

const ACCENT_COLORS = ['#7c3aed','#0284c7','#059669','#d97706','#db2777','#0891b2']

const gradeStyle: Record<string, string> = {
  'A+':'badge-success','A':'badge-success','A−':'badge-success',
  'B+':'badge-info','B':'badge-info','B−':'badge-info',
  'C+':'badge-warning','C':'badge-warning',
}

const STATUS_COLORS: Record<string, { dot: string; text: string }> = {
  'Active':    { dot: '#10b981', text: '#10b981' },
  'On Leave':  { dot: '#fbbf24', text: '#fbbf24' },
  'Suspended': { dot: '#f87171', text: '#f87171' },
}

const FILTERS = ['All', 'Active', 'On Leave', 'Suspended'] as const

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function StudentAvatar({ name, index }: { name: string; index: number }) {
  const [err, setErr] = useState(false)
  const color = ACCENT_COLORS[index % ACCENT_COLORS.length]
  const photo = STUDENT_PHOTOS[index % STUDENT_PHOTOS.length]

  if (!err) return (
    <img src={photo} alt={name} onError={() => setErr(true)}
      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}30`, flexShrink: 0 }} />
  )
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: `${color}20`, border: `2px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color,
    }}>{getInitials(name)}</div>
  )
}

export default function Students() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', course: '', grade: '', status: 'Active' })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [analysisModal, setAnalysisModal] = useState(false)
  const [analysisData, setAnalysisData] = useState<Analysis | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  const fetchStudents = useCallback(async () => {
    try { setLoading(true); const res = await api.get('/students'); setStudents(res.data.students) }
    catch { setError('Failed to load students') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  async function handleAnalyze(id: number) {
    setAnalysisData(null); setAnalysisModal(true); setAnalysisLoading(true)
    try { const res = await api.get(`/ai/analyze/${id}`); setAnalysisData(res.data) }
    catch { toast.error('Failed to analyze student'); setAnalysisModal(false) }
    finally { setAnalysisLoading(false) }
  }

  async function handleAdd() {
    if (!isAdmin || !form.name || !form.course) return
    setSaving(true)
    try {
      await api.post('/students', form); await fetchStudents()
      setShowAdd(false); setForm({ name: '', course: '', grade: '', status: 'Active' })
      toast.success('Student added successfully!')
    } catch { toast.error('Failed to add student') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    try { await api.delete(`/students/${deleteId}`); setStudents(prev => prev.filter(s => s.id !== deleteId)); toast.success('Student deleted.') }
    catch { toast.error('Failed to delete student') }
    finally { setDeleteLoading(false); setDeleteId(null) }
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) &&
    (courseFilter === 'All' || s.course === courseFilter) &&
    (statusFilter === 'All' || s.status === statusFilter)
  )
  const courseOptions = ['All', ...new Set(students.map(s => s.course).filter(Boolean))]

  const summaryStats = [
    { label: 'Total', value: students.length, color: 'var(--text)' },
    { label: 'Active', value: students.filter(s => s.status === 'Active').length, color: '#10b981' },
    { label: 'On Leave', value: students.filter(s => s.status === 'On Leave').length, color: '#fbbf24' },
    { label: 'Suspended', value: students.filter(s => s.status === 'Suspended').length, color: '#f87171' },
  ]

  const ADD_FIELDS: Array<{ label: string; key: StudentFormKey; placeholder: string }> = [
    { label: 'Full Name *', key: 'name', placeholder: 'Student name' },
    { label: 'Course *', key: 'course', placeholder: 'e.g. Mathematics' },
    { label: 'Grade', key: 'grade', placeholder: 'e.g. A, B+' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <ConfirmDialog open={deleteId !== null} title="Delete Student"
        message={`Are you sure you want to delete "${deleteName}"? This action cannot be undone.`}
        confirmLabel={deleteLoading ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />

      <Modal open={showAdd && isAdmin} onClose={() => setShowAdd(false)} title="Add New Student"
        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>}
        footer={
          <div className="flex gap-2.5">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 text-[13px] btn-ghost rounded-xl">Cancel</button>
            <button onClick={handleAdd} disabled={saving || !form.name || !form.course} className="flex-1 py-2.5 text-[13px] btn-primary rounded-xl">
              {saving ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        }>
        <div className="flex flex-col gap-4">
          {ADD_FIELDS.map((f: { label: string; key: StudentFormKey; placeholder: string }) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
              <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder} className="input" />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input">
              {['Active', 'On Leave', 'Suspended'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <Modal open={analysisModal} onClose={() => setAnalysisModal(false)}
        title={analysisData ? `Performance: ${analysisData.student.name}` : 'Analyzing...'}
        subtitle="AI-powered student insights" maxWidth={580}
        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg>}
        footer={<button onClick={() => setAnalysisModal(false)} className="w-full py-2.5 text-[13px] btn-ghost rounded-xl">Close</button>}>
        {analysisLoading ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Analyzing student data...</p>
          </div>
        ) : analysisData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Attendance', value: `${analysisData.stats.attendanceRate}%`, color: '#10b981' },
                { label: 'Paid', value: analysisData.stats.paidPayments, color: '#60a5fa' },
                { label: 'Absences', value: analysisData.stats.absentCount, color: '#fbbf24' },
              ].map(s => (
                <div key={s.label} className="rounded-xl px-4 py-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                  <p className="text-[22px] font-extrabold leading-none" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <p className="text-[11px] font-bold mb-2" style={{ color: '#a78bfa' }}>AI Analysis</p>
              <div className="text-[13px] leading-7 whitespace-pre-wrap" dir="rtl" style={{ color: 'var(--text)', textAlign: 'right' }}>
                {analysisData.analysis}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-faint)' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..."
              className="bg-transparent text-[13px] outline-none w-44" style={{ color: 'var(--text)', caretColor: 'var(--accent)' }} />
          </div>
          <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
            className="rounded-xl px-3 py-2 text-[13px] outline-none cursor-pointer"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            {courseOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-1.5">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                style={{
                  background: statusFilter === f ? 'rgba(124,58,237,0.18)' : 'var(--surface)',
                  color: statusFilter === f ? '#a78bfa' : 'var(--text-muted)',
                  border: `1px solid ${statusFilter === f ? 'rgba(124,58,237,0.3)' : 'var(--border)'}`,
                }}>{f}</button>
            ))}
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 px-4 py-2 text-[13px]" style={{ borderRadius: 12 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Student
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {summaryStats.map(item => (
          <div key={item.label} className="card px-5 py-4 flex items-center justify-between">
            <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
            <span className="text-[22px] font-extrabold" style={{ color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} student{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Student', 'Course', 'Grade', 'Status', 'Joined', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={6} cols={6} />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}>
                <EmptyState title="No students found" message="Try adjusting your search or filters."
                  action={search || courseFilter !== 'All' || statusFilter !== 'All'
                    ? { label: 'Clear filters', onClick: () => { setSearch(''); setCourseFilter('All'); setStatusFilter('All') } }
                    : undefined} />
              </td></tr>
            ) : filtered.map((s, i) => {
              const sc = STATUS_COLORS[s.status] ?? { dot: '#94a3b8', text: '#94a3b8' }
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <StudentAvatar name={s.name} index={i} />
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[13px]" style={{ color: 'var(--text-muted)' }}>{s.course}</td>
                  <td className="px-5 py-3.5">
                    {s.grade
                      ? <span className={`badge ${gradeStyle[s.grade] || 'badge-info'}`}>{s.grade}</span>
                      : <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                      <span className="text-[12px] font-medium" style={{ color: sc.text }}>{s.status}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[12px]" style={{ color: 'var(--text-faint)' }}>
                    {new Date(s.joinedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleAnalyze(s.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: 'var(--text-faint)' }} title="AI Analysis"
                        onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.background = 'rgba(124,58,237,0.12)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                      </button>
                      {isAdmin && (
                        <button onClick={() => { setDeleteId(s.id); setDeleteName(s.name) }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ color: 'var(--text-faint)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl px-4 py-3" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <p className="text-[13px]" style={{ color: '#f87171' }}>{error}</p>
          <button onClick={fetchStudents} className="ml-auto text-[12px] underline" style={{ color: '#f87171' }}>Retry</button>
        </div>
      )}
    </div>
  )
}
