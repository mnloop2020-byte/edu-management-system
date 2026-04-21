import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../hooks/useLocale'
import { toast } from '../components/ui/Toast'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Modal } from '../components/ui/Modal'
import { SkeletonTable } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

interface Student {
  id: number
  name: string
  course: string
  grade: string | null
  status: string
  joinedAt: string
  subjectsCount?: number
  gpa?: number | null
  attendanceRate?: number
  absentCount?: number
  indicator?: 'SAFE' | 'WARNING' | 'RISK'
}

interface Analysis {
  student: { id: number; name: string; course: string; grade: string | null; status: string }
  stats: { attendanceRate: number; presentCount: number; absentCount: number; lateCount: number; paidPayments: number; pendingPayments: number; overduePayments: number }
  analysis: string
}

type StudentFormKey = 'name' | 'course' | 'grade'

const FILTERS = ['All', 'Active', 'At Risk'] as const
const avatarColors = ['from-violet-500 to-indigo-600', 'from-blue-500 to-cyan-600', 'from-emerald-500 to-teal-600', 'from-amber-400 to-orange-500', 'from-pink-500 to-rose-600']

function getInitials(name: string) {
  return name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()
}

function getRiskStyle(indicator: Student['indicator'], locale: 'ar' | 'en') {
  if (indicator === 'RISK') return { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: locale === 'ar' ? 'خطر' : 'Risk' }
  if (indicator === 'WARNING') return { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: locale === 'ar' ? 'تحذير' : 'Warning' }
  return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: locale === 'ar' ? 'آمن' : 'Safe' }
}

function getCopy(locale: 'ar' | 'en') {
  return locale === 'ar'
    ? {
        loadError: 'فشل تحميل الطلاب',
        analyzeError: 'فشل تحليل الطالب',
        addSuccess: 'تمت إضافة الطالب',
        addError: 'فشل إضافة الطالب',
        deleteSuccess: 'تم حذف الطالب',
        deleteError: 'فشل حذف الطالب',
        deleteStudent: 'حذف طالب',
        deleteMessage: 'هل تريد حذف',
        deleting: 'جارٍ الحذف...',
        delete: 'حذف',
        addNewStudent: 'إضافة طالب جديد',
        cancel: 'إلغاء',
        addStudent: 'إضافة طالب',
        syncAcademic: 'مزامنة البيانات الأكاديمية',
        syncingAcademic: 'جارٍ مزامنة البيانات...',
        syncAcademicSuccess: 'تمت مزامنة البيانات الأكاديمية',
        syncAcademicError: 'فشلت مزامنة البيانات الأكاديمية',
        adding: 'جارٍ الإضافة...',
        fullName: 'الاسم الكامل *',
        studentName: 'اسم الطالب',
        courseRequired: 'المسار *',
        coursePlaceholder: 'المسار أو الصف',
        grade: 'التقدير',
        gradePlaceholder: 'A, B+, C...',
        status: 'الحالة',
        active: 'نشط',
        onLeave: 'إجازة',
        suspended: 'موقوف',
        aiSummary: 'الملخص الذكي',
        analyzing: 'جارٍ تحليل ملف الطالب...',
        attendance: 'الحضور',
        absences: 'الغيابات',
        pending: 'المستحق',
        workspace: 'مساحة الطلاب',
        title: 'تابع الطلاب بإشارات أوضح.',
        subtitle: 'ابحث فورًا، وابرز الطلاب المعرضين للخطر، واحتفظ بسياق الحضور والأداء داخل جدول تشغيلي واحد.',
        totalStudents: 'إجمالي الطلاب',
        warnings: 'تحذيرات',
        atRisk: 'معرضون للخطر',
        searchPlaceholder: 'ابحث باسم الطالب...',
        visibleStudents: 'طالب ظاهر',
        clearFilters: 'مسح الفلاتر',
        student: 'الطالب',
        subjects: 'المواد',
        gpa: 'المعدل',
        attendanceLabel: 'الحضور',
        risk: 'المخاطر',
        joined: 'انضم',
        outOfFour: 'من 4.00',
        absencesCount: 'غيابات',
        profile: 'الملف',
        manageGrades: 'الدرجات',
        retry: 'إعادة المحاولة',
        noStudentsFound: 'لا يوجد طلاب',
        noStudentsFoundMessage: 'جرّب بحثًا أو فلترًا مختلفًا.',
        all: 'الكل',
        close: 'إغلاق',
      }
    : {
        loadError: 'Failed to load students',
        analyzeError: 'Failed to analyze student',
        addSuccess: 'Student added successfully',
        addError: 'Failed to add student',
        deleteSuccess: 'Student deleted',
        deleteError: 'Failed to delete student',
        deleteStudent: 'Delete Student',
        deleteMessage: 'Are you sure you want to delete',
        deleting: 'Deleting...',
        delete: 'Delete',
        addNewStudent: 'Add New Student',
        cancel: 'Cancel',
        addStudent: 'Add Student',
        syncAcademic: 'Sync Academic Data',
        syncingAcademic: 'Syncing academic data...',
        syncAcademicSuccess: 'Academic data synced successfully',
        syncAcademicError: 'Failed to sync academic data',
        adding: 'Adding...',
        fullName: 'Full Name *',
        studentName: 'Student name',
        courseRequired: 'Course *',
        coursePlaceholder: 'Course or class',
        grade: 'Grade',
        gradePlaceholder: 'A, B+, C...',
        status: 'Status',
        active: 'Active',
        onLeave: 'On Leave',
        suspended: 'Suspended',
        aiSummary: 'AI Summary',
        analyzing: 'Analyzing student profile...',
        attendance: 'Attendance',
        absences: 'Absences',
        pending: 'Pending',
        workspace: 'Students Workspace',
        title: 'Monitor learners with clearer signals.',
        subtitle: 'Search instantly, surface at-risk students faster, and keep attendance and performance context visible in one operational table.',
        totalStudents: 'Total Students',
        warnings: 'Warnings',
        atRisk: 'At Risk',
        searchPlaceholder: 'Search by student name...',
        visibleStudents: 'students visible',
        clearFilters: 'Clear filters',
        student: 'Student',
        subjects: 'Subjects',
        gpa: 'GPA',
        attendanceLabel: 'Attendance',
        risk: 'Risk',
        joined: 'Joined',
        outOfFour: 'out of 4.00',
        absencesCount: 'absences',
        profile: 'Profile',
        manageGrades: 'Grades',
        retry: 'Retry',
        noStudentsFound: 'No students found',
        noStudentsFoundMessage: 'Try a different search or filter combination.',
        all: 'All',
        close: 'Close',
      }
}

export default function Students() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { locale } = useLocale()
  const copy = useMemo(() => getCopy(locale), [locale])
  const isAdmin = user?.role === 'ADMIN'

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<typeof FILTERS[number]>('All')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', course: '', grade: '', status: 'Active' })
  const [saving, setSaving] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [analysisModal, setAnalysisModal] = useState(false)
  const [analysisData, setAnalysisData] = useState<Analysis | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  const dateLocale = locale === 'ar' ? 'ar' : 'en-GB'
  const statusFilterLabels: Record<typeof FILTERS[number], string> = {
    All: copy.all,
    Active: copy.active,
    'At Risk': copy.atRisk,
  }

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await api.get('/students')
      setStudents(res.data.students)
    } catch {
      setError(copy.loadError)
    } finally {
      setLoading(false)
    }
  }, [copy.loadError])

  useEffect(() => { void fetchStudents() }, [fetchStudents])

  useEffect(() => {
    const status = searchParams.get('status')

    if (status === 'at-risk' || status === 'risk' || status === 'warning') {
      setStatusFilter('At Risk')
    } else if (status === 'active') {
      setStatusFilter('Active')
    } else {
      setStatusFilter('All')
    }
  }, [searchParams])

  async function handleAnalyze(id: number) {
    setAnalysisModal(true)
    setAnalysisLoading(true)
    setAnalysisData(null)
    try {
      const res = await api.get(`/ai/analyze/${id}`)
      setAnalysisData(res.data)
    } catch {
      toast.error(copy.analyzeError)
      setAnalysisModal(false)
    } finally {
      setAnalysisLoading(false)
    }
  }

  async function handleAdd() {
    if (!isAdmin || !form.name || !form.course) return
    setSaving(true)
    try {
      await api.post('/students', form)
      await fetchStudents()
      setShowAdd(false)
      setForm({ name: '', course: '', grade: '', status: 'Active' })
      toast.success(copy.addSuccess)
    } catch {
      toast.error(copy.addError)
    } finally {
      setSaving(false)
    }
  }

  async function handleSyncAcademicData() {
    if (!isAdmin) return
    setSyncLoading(true)
    try {
      await api.post('/academic/bootstrap')
      await fetchStudents()
      toast.success(copy.syncAcademicSuccess)
    } catch {
      toast.error(copy.syncAcademicError)
    } finally {
      setSyncLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await api.delete(`/students/${deleteId}`)
      setStudents(current => current.filter(student => student.id !== deleteId))
      toast.success(copy.deleteSuccess)
    } catch {
      toast.error(copy.deleteError)
    } finally {
      setDeleteLoading(false)
      setDeleteId(null)
    }
  }

  const highlightedStudentId = Number(searchParams.get('studentId') || 0)

  const filtered = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase())
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' ? student.status === 'Active' : student.indicator !== 'SAFE')
      return matchesSearch && matchesStatus
    }).sort((a, b) => {
      if (a.id === highlightedStudentId) return -1
      if (b.id === highlightedStudentId) return 1
      return a.name.localeCompare(b.name)
    })
  }, [students, search, statusFilter, highlightedStudentId])

  const summary = {
    total: students.length,
    active: students.filter(student => student.status === 'Active').length,
    risk: students.filter(student => student.indicator === 'RISK').length,
    warning: students.filter(student => student.indicator === 'WARNING').length,
  }

  const addFields: Array<{ label: string; key: StudentFormKey; placeholder: string }> = [
    { label: copy.fullName, key: 'name', placeholder: copy.studentName },
    { label: copy.courseRequired, key: 'course', placeholder: copy.coursePlaceholder },
    { label: copy.grade, key: 'grade', placeholder: copy.gradePlaceholder },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <ConfirmDialog
        open={deleteId !== null}
        title={copy.deleteStudent}
        message={`${copy.deleteMessage} "${deleteName}"?`}
        confirmLabel={deleteLoading ? copy.deleting : copy.delete}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <Modal
        open={showAdd && isAdmin}
        onClose={() => setShowAdd(false)}
        title={copy.addNewStudent}
        footer={
          <div className="flex gap-2.5">
            <button onClick={() => setShowAdd(false)} className="btn-ghost flex-1 py-2.5 text-[13px] rounded-xl">{copy.cancel}</button>
            <button onClick={handleAdd} disabled={saving || !form.name || !form.course} className="btn-primary flex-1 py-2.5 text-[13px] rounded-xl">
              {saving ? copy.adding : copy.addStudent}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {addFields.map(field => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{field.label}</label>
              <input value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })} placeholder={field.placeholder} className="input" />
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{copy.status}</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input">
              {[
                { value: 'Active', label: copy.active },
                { value: 'On Leave', label: copy.onLeave },
                { value: 'Suspended', label: copy.suspended },
              ].map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        open={analysisModal}
        onClose={() => setAnalysisModal(false)}
        title={analysisData ? `${copy.aiSummary}: ${analysisData.student.name}` : copy.aiSummary}
        maxWidth={580}
        footer={<button onClick={() => setAnalysisModal(false)} className="btn-ghost w-full py-2.5 text-[13px] rounded-xl">{copy.close}</button>}
      >
        {analysisLoading ? (
          <div className="py-10 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{copy.analyzing}</p>
          </div>
        ) : analysisData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: copy.attendance, value: `${analysisData.stats.attendanceRate}%`, color: '#10b981' },
                { label: copy.absences, value: analysisData.stats.absentCount, color: '#fbbf24' },
                { label: copy.pending, value: analysisData.stats.pendingPayments, color: '#f87171' },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                  <p className="text-[18px] font-bold" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.16)' }}>
              <p className="text-[11px] font-bold mb-2" style={{ color: '#a78bfa' }}>{copy.aiSummary}</p>
              <div className="text-[13px] leading-7 whitespace-pre-wrap" dir="rtl" style={{ color: 'var(--text)', textAlign: 'right' }}>{analysisData.analysis}</div>
            </div>
          </div>
        ) : null}
      </Modal>

      <section className="card p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(circle at top right, rgba(124,58,237,0.18), transparent 38%)' }} />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-faint)' }}>{copy.workspace}</p>
            <h2 className="text-[26px] font-extrabold mt-2" style={{ color: 'var(--text)' }}>{copy.title}</h2>
            <p className="text-[13px] mt-3 max-w-[680px]" style={{ color: 'var(--text-muted)' }}>{copy.subtitle}</p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button onClick={() => void handleSyncAcademicData()} disabled={syncLoading} className="btn-ghost px-4 py-2.5 text-[13px]" style={{ borderRadius: 12 }}>
                {syncLoading ? copy.syncingAcademic : copy.syncAcademic}
              </button>
              <button onClick={() => setShowAdd(true)} className="btn-primary px-4 py-2.5 text-[13px]" style={{ borderRadius: 12 }}>{copy.addStudent}</button>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: copy.totalStudents, value: summary.total, color: '#a78bfa' },
          { label: copy.active, value: summary.active, color: '#10b981' },
          { label: copy.warnings, value: summary.warning, color: '#fbbf24' },
          { label: copy.atRisk, value: summary.risk, color: '#f87171' },
        ].map(item => (
          <div key={item.label} className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{item.label}</p>
            <p className="text-[26px] font-extrabold mt-2" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </section>

      <section className="card p-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 min-w-[230px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-faint)' }}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={copy.searchPlaceholder} className="bg-transparent outline-none text-[13px] flex-1" style={{ color: 'var(--text)' }} />
            </div>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(item => (
              <button
                key={item}
                onClick={() => setStatusFilter(item)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                style={{
                  background: statusFilter === item ? 'rgba(124,58,237,0.16)' : 'transparent',
                  color: statusFilter === item ? '#a78bfa' : 'var(--text-muted)',
                  border: `1px solid ${statusFilter === item ? 'rgba(124,58,237,0.35)' : 'var(--border)'}`,
                }}
              >
                {statusFilterLabels[item]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>{filtered.length} {copy.visibleStudents}</p>
          {(search || statusFilter !== 'All') && (
            <button onClick={() => { setSearch(''); setStatusFilter('All') }} className="btn-ghost px-3 py-1.5 text-[12px]">
              {copy.clearFilters}
            </button>
          )}
        </div>

        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[copy.student, copy.subjects, copy.gpa, copy.attendanceLabel, copy.status, copy.risk, ''].map(header => (
                <th key={header} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={6} cols={7} />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7}><EmptyState title={copy.noStudentsFound} message={copy.noStudentsFoundMessage} /></td></tr>
            ) : filtered.map((student, index) => {
              const tone = getRiskStyle(student.indicator, locale)
              return (
                <tr
                  key={student.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: student.id === highlightedStudentId ? 'rgba(124,58,237,0.08)' : 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = student.id === highlightedStudentId ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.025)')}
                  onMouseLeave={e => (e.currentTarget.style.background = student.id === highlightedStudentId ? 'rgba(124,58,237,0.08)' : 'transparent')}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColors[index % avatarColors.length]} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                        {getInitials(student.name)}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{student.name}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{copy.joined} {new Date(student.joinedAt).toLocaleDateString(dateLocale, { month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[12px]" style={{ color: 'var(--text)' }}>
                    {student.subjectsCount ?? 0}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-semibold" style={{ color: student.gpa === null || student.gpa === undefined ? 'var(--text-faint)' : 'var(--text)' }}>
                      {student.gpa === null || student.gpa === undefined ? 'N/A' : student.gpa.toFixed(2)}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{copy.outOfFour}</p>
                  </td>
                  <td className="px-5 py-4 min-w-[150px]">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px]" style={{ color: 'var(--text)' }}>{Math.round(student.attendanceRate || 0)}%</span>
                        <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{student.absentCount || 0} {copy.absencesCount}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, student.attendanceRate || 0))}%`, background: tone.color }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge ${student.status === 'Active' ? 'badge-success' : student.status === 'On Leave' ? 'badge-warning' : 'badge-error'}`}>{student.status === 'Active' ? copy.active : student.status === 'On Leave' ? copy.onLeave : copy.suspended}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ color: tone.color, background: tone.bg }}>
                      {tone.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => navigate(`/students/${student.id}`)} className="btn-ghost px-3 py-1.5 text-[11px]" style={{ borderRadius: 10 }}>
                        {copy.profile}
                      </button>
                      <button onClick={() => navigate(`/students/${student.id}#subjects`)} className="btn-ghost px-3 py-1.5 text-[11px]" style={{ borderRadius: 10 }}>
                        {copy.manageGrades}
                      </button>
                      <button onClick={() => handleAnalyze(student.id)} className="btn-ghost px-3 py-1.5 text-[11px]" style={{ borderRadius: 10 }}>
                        {copy.aiSummary}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => { setDeleteId(student.id); setDeleteName(student.name) }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          style={{ color: 'var(--text-faint)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent' }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      {error && (
        <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <p className="text-[13px]" style={{ color: '#f87171', flex: 1 }}>{error}</p>
          <button onClick={fetchStudents} className="btn-ghost px-3 py-1.5 text-[12px]">{copy.retry}</button>
        </div>
      )}
    </div>
  )
}
