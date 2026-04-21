import { useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../hooks/useLocale'
import { toast } from '../components/ui/Toast'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'

interface Assignment {
  id: number
  title: string
  description: string | null
  dueAt: string
  maxScore: number
  class?: { id: number; name: string; code: string }
  teacher?: { id: number; name: string; subject?: string }
  submission?: {
    id: number
    submittedAt: string | null
    fileUrl: string | null
    note: string | null
    score: number | null
    feedback: string | null
    status: string
  }
}
interface MetaOffering {
  id: number
  section: string
  subject: { id: number; name: string; code: string; creditHours: number }
  semester: { id: number; name: string; code: string }
  teacher: { id: number; name: string } | null
}
interface Submission {
  id: number
  fileUrl: string | null
  feedback: string | null
  note: string | null
  score: number | null
  status: string
  student: { id: number; name: string; course: string }
}
type FilterKey = 'all' | 'pending' | 'submitted' | 'late' | 'graded'

const FILTERS: FilterKey[] = ['all', 'pending', 'submitted', 'late', 'graded']

function getCopy(locale: 'ar' | 'en') {
  return locale === 'ar'
    ? {
        filters: { all: 'الكل', pending: 'معلق', submitted: 'تم التسليم', late: 'متأخر', graded: 'مقيّم' } as Record<FilterKey, string>,
        statuses: { graded: 'مقيّم', late: 'متأخر', submitted: 'تم التسليم', pending: 'معلق' },
        loadError: 'فشل تحميل الواجبات',
        createSuccess: 'تم إنشاء الواجب',
        createError: 'فشل إنشاء الواجب',
        submitSuccess: 'تم تسليم الواجب',
        submitError: 'فشل تسليم الواجب',
        gradeSuccess: 'تم تقييم التسليم',
        gradeError: 'فشل تقييم التسليم',
        createAssignment: 'إنشاء واجب',
        cancel: 'إلغاء',
        create: 'إنشاء',
        title: 'العنوان',
        chooseSubject: 'اختر المادة',
        description: 'الوصف',
        attachment: 'رابط المرفق',
        assignment: 'الواجب',
        close: 'إغلاق',
        deadline: 'الموعد النهائي',
        submission: 'التسليم',
        submissionHint: 'ألصق رابط الملف وأضف ملاحظة إن رغبت.',
        fileUrl: 'رابط الملف',
        note: 'ملاحظة',
        submitAssignment: 'تسليم الواجب',
        loadingSubmissions: 'جارٍ تحميل التسليمات...',
        noSubmissions: 'لا توجد تسليمات',
        noSubmissionsMessage: 'سيظهر الطلاب هنا بعد تسليم هذا الواجب.',
        hub: 'مركز الواجبات',
        heroTitle: 'تابع المواعيد والتسليمات والتقييم من مكان واحد.',
        heroSubtitle: 'مصمم للمعلمين والطلاب مع مؤشرات حالة أوضح وسير عمل أسرع.',
        total: 'الإجمالي',
        pending: 'معلق',
        submitted: 'تم التسليم',
        late: 'متأخر',
        graded: 'مقيّم',
        loading: 'جارٍ تحميل الواجبات...',
        noAssignments: 'لا توجد واجبات',
        noAssignmentsMessage: 'ستظهر الواجبات هنا بعد إنشائها أو إسنادها.',
        noDescription: 'لا يوجد وصف.',
        due: 'الاستحقاق',
        pts: 'نقطة',
        openFile: 'فتح الملف',
        score: 'النتيجة',
        feedback: 'التغذية الراجعة',
        gradeAction: 'تقييم',
        classFallback: 'مادة',
      }
    : {
        filters: { all: 'All', pending: 'Pending', submitted: 'Submitted', late: 'Late', graded: 'Graded' } as Record<FilterKey, string>,
        statuses: { graded: 'Graded', late: 'Late', submitted: 'Submitted', pending: 'Pending' },
        loadError: 'Failed to load assignments',
        createSuccess: 'Assignment created',
        createError: 'Failed to create assignment',
        submitSuccess: 'Assignment submitted',
        submitError: 'Failed to submit assignment',
        gradeSuccess: 'Submission graded',
        gradeError: 'Failed to grade submission',
        createAssignment: 'Create Assignment',
        cancel: 'Cancel',
        create: 'Create',
        title: 'Title',
        chooseSubject: 'Choose subject',
        description: 'Description',
        attachment: 'Attachment URL (optional)',
        assignment: 'Assignment',
        close: 'Close',
        deadline: 'Deadline',
        submission: 'Submission',
        submissionHint: 'Paste a file URL and an optional note.',
        fileUrl: 'File URL',
        note: 'Note',
        submitAssignment: 'Submit Assignment',
        loadingSubmissions: 'Loading submissions...',
        noSubmissions: 'No submissions',
        noSubmissionsMessage: 'Students will appear here after they submit this assignment.',
        hub: 'Assignments Hub',
        heroTitle: 'Track deadlines, submissions, and grading in one place.',
        heroSubtitle: 'Designed for both teachers and students with clearer status signals and faster daily workflows.',
        total: 'Total',
        pending: 'Pending',
        submitted: 'Submitted',
        late: 'Late',
        graded: 'Graded',
        loading: 'Loading assignments...',
        noAssignments: 'No assignments',
        noAssignmentsMessage: 'Assignments will appear here once created or assigned.',
        noDescription: 'No description provided.',
        due: 'Due',
        pts: 'pts',
        openFile: 'Open file',
        score: 'Score',
        feedback: 'Feedback',
        gradeAction: 'Grade',
        classFallback: 'Class',
      }
}

function getStatusTone(status: string, copy: ReturnType<typeof getCopy>) {
  if (status === 'graded') return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: copy.statuses.graded }
  if (status === 'late') return { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: copy.statuses.late }
  if (status === 'submitted') return { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: copy.statuses.submitted }
  return { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: copy.statuses.pending }
}

export default function Assignments() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const copy = useMemo(() => getCopy(locale), [locale])
  const role = user?.role || 'ADMIN'
  const canManage = role === 'ADMIN' || role === 'TEACHER'
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [offerings, setOfferings] = useState<MetaOffering[]>([])
  const [selected, setSelected] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [form, setForm] = useState({ title: '', description: '', subjectOfferingId: '', dueAt: '', maxScore: '100', attachmentUrl: '' })
  const [submitForm, setSubmitForm] = useState({ fileUrl: '', note: '' })
  const noSubjectsLabel = locale === 'ar' ? 'لا توجد مواد متاحة' : 'No subjects available'
  const teacherLabel = locale === 'ar' ? 'المعلم' : 'Teacher'
  const termLabel = locale === 'ar' ? 'الفصل' : 'Term'
  const teacherMissingLabel = locale === 'ar' ? 'لم يحدد المعلم بعد' : 'Teacher not assigned'
  const linkTeacherFirstLabel = locale === 'ar'
    ? 'اربط هذه المادة بمعلم أولًا قبل إنشاء الواجب'
    : 'Link this subject to a teacher first before creating assignments'
  const subjectOptions = useMemo(() => {
    const seen = new Set<number>()
    const result: MetaOffering[] = []

    for (const offering of offerings) {
      const subjectId = offering.subject.id
      if (seen.has(subjectId)) continue
      seen.add(subjectId)
      result.push(offering)
    }

    return result
  }, [offerings])
  const selectedOffering = useMemo(
    () => offerings.find((item) => item.id === Number(form.subjectOfferingId)) || null,
    [offerings, form.subjectOfferingId],
  )
  const createBlockedByTeacher = canManage && role !== 'TEACHER' && !!selectedOffering && !selectedOffering.teacher

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const endpoint = role === 'STUDENT' ? '/assignments/my' : '/assignments'
        const [assignmentsRes, offeringsRes] = await Promise.all([
          api.get(endpoint),
          canManage ? api.get('/academic/offerings') : Promise.resolve(null),
        ])
        if (!active) return
        setAssignments(assignmentsRes.data.assignments)
        if (offeringsRes) setOfferings(offeringsRes.data.offerings ?? [])
      } catch {
        if (active) toast.error(copy.loadError)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [role, canManage, copy.loadError])

  useEffect(() => {
    if (!showCreate) return

    setForm((current) => {
      const allowedIds = new Set(subjectOptions.map((item) => String(item.id)))
      if (current.subjectOfferingId && allowedIds.has(current.subjectOfferingId)) {
        return current
      }

      const first = subjectOptions[0]
      return { ...current, subjectOfferingId: first ? String(first.id) : '' }
    })
  }, [showCreate, subjectOptions])

  async function reloadAssignments() {
    const endpoint = role === 'STUDENT' ? '/assignments/my' : '/assignments'
    const res = await api.get(endpoint)
    setAssignments(res.data.assignments)
  }

  async function openDetails(assignment: Assignment) {
    setSelected(assignment)
    if (!canManage) return
    setDetailsLoading(true)
    try {
      const res = await api.get(`/assignments/${assignment.id}/submissions`)
      setSubmissions(res.data.assignment.submissions)
    } catch {
      setSubmissions([])
    } finally {
      setDetailsLoading(false)
    }
  }

  async function createAssignment() {
    if (!form.subjectOfferingId) {
      toast.error(copy.chooseSubject)
      return
    }

    try {
      await api.post('/assignments', { ...form, subjectOfferingId: Number(form.subjectOfferingId), maxScore: Number(form.maxScore) })
      setShowCreate(false)
      setForm({ title: '', description: '', subjectOfferingId: '', dueAt: '', maxScore: '100', attachmentUrl: '' })
      await reloadAssignments()
      toast.success(copy.createSuccess)
    } catch (error) {
      toast.error(isAxiosError(error) ? error.response?.data?.message || copy.createError : copy.createError)
    }
  }

  async function submitAssignment() {
    if (!selected) return
    try {
      await api.post(`/assignments/${selected.id}/submit`, submitForm)
      setSelected(null)
      setSubmitForm({ fileUrl: '', note: '' })
      await reloadAssignments()
      toast.success(copy.submitSuccess)
    } catch {
      toast.error(copy.submitError)
    }
  }

  async function gradeSubmission(submissionId: number, score: string, feedback: string) {
    try {
      await api.patch(`/assignments/submissions/${submissionId}/grade`, { score: Number(score), feedback })
      if (selected) await openDetails(selected)
      toast.success(copy.gradeSuccess)
    } catch {
      toast.error(copy.gradeError)
    }
  }

  const filtered = useMemo(() => assignments.filter(item => filter === 'all' || item.submission?.status === filter || (!item.submission && filter === 'pending')), [assignments, filter])
  const summary = {
    total: assignments.length,
    pending: assignments.filter(item => !item.submission || item.submission.status === 'pending').length,
    submitted: assignments.filter(item => item.submission?.status === 'submitted').length,
    late: assignments.filter(item => item.submission?.status === 'late').length,
    graded: assignments.filter(item => item.submission?.status === 'graded').length,
  }

  const dateLocale = locale === 'ar' ? 'ar' : 'en-GB'

  return (
    <div className="space-y-5 animate-fade-in">
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={copy.createAssignment} footer={<div className="flex gap-2.5"><button onClick={() => setShowCreate(false)} className="btn-ghost flex-1 py-2.5 text-[13px] rounded-xl">{copy.cancel}</button><button onClick={createAssignment} disabled={createBlockedByTeacher || !form.subjectOfferingId} className="btn-primary flex-1 py-2.5 text-[13px] rounded-xl">{copy.create}</button></div>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select className="input md:col-span-2" value={form.subjectOfferingId} onChange={e => setForm({ ...form, subjectOfferingId: e.target.value })}>
            <option value="">{copy.chooseSubject}</option>
            {subjectOptions.map(item => <option key={item.id} value={item.id}>{item.subject.name}</option>)}
          </select>
          <input className="input md:col-span-2" placeholder={copy.title} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          {subjectOptions.length === 0 && (
            <div className="md:col-span-2 rounded-xl px-3.5 py-3 text-[12px]" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)', color: '#fbbf24' }}>
              {noSubjectsLabel}
            </div>
          )}
          {selectedOffering && (
            <div className="md:col-span-2 rounded-xl px-3.5 py-3 text-[12px] space-y-1.5" style={{ background: createBlockedByTeacher ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${createBlockedByTeacher ? 'rgba(248,113,113,0.18)' : 'var(--border)'}`, color: createBlockedByTeacher ? '#f87171' : 'var(--text-muted)' }}>
              <p>{teacherLabel}: {selectedOffering.teacher?.name || teacherMissingLabel}</p>
              <p>{termLabel}: {selectedOffering.semester.name} - {selectedOffering.section}</p>
              {createBlockedByTeacher && <p>{linkTeacherFirstLabel}</p>}
            </div>
          )}
          <input className="input md:col-span-2" placeholder={copy.description} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <input className="input" type="datetime-local" value={form.dueAt} onChange={e => setForm({ ...form, dueAt: e.target.value })} />
          <input className="input" type="number" value={form.maxScore} onChange={e => setForm({ ...form, maxScore: e.target.value })} />
          <input className="input md:col-span-2" placeholder={copy.attachment} value={form.attachmentUrl} onChange={e => setForm({ ...form, attachmentUrl: e.target.value })} />
        </div>
      </Modal>

      <Modal open={!!selected} onClose={() => { setSelected(null); setSubmissions([]) }} title={selected?.title || copy.assignment} maxWidth={760} footer={<button onClick={() => { setSelected(null); setSubmissions([]) }} className="btn-ghost w-full py-2.5 text-[13px] rounded-xl">{copy.close}</button>}>
        {selected && !canManage ? (
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
              <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{copy.deadline}</p>
              <p className="text-[14px] font-semibold mt-1" style={{ color: 'var(--text)' }}>{new Date(selected.dueAt).toLocaleString()}</p>
              {selected.submission && <p className="text-[12px] mt-3" style={{ color: getStatusTone(selected.submission.status, copy).color }}>{getStatusTone(selected.submission.status, copy).label}</p>}
            </div>
            <div className="rounded-2xl p-4 border-dashed border-2" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{copy.submission}</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{copy.submissionHint}</p>
              <div className="space-y-3 mt-4">
                <input className="input" placeholder={copy.fileUrl} value={submitForm.fileUrl} onChange={e => setSubmitForm({ ...submitForm, fileUrl: e.target.value })} />
                <input className="input" placeholder={copy.note} value={submitForm.note} onChange={e => setSubmitForm({ ...submitForm, note: e.target.value })} />
                <button onClick={submitAssignment} className="btn-primary w-full py-2.5 text-[13px] rounded-xl">{copy.submitAssignment}</button>
              </div>
            </div>
          </div>
        ) : detailsLoading ? (
          <div className="py-8 text-[13px]" style={{ color: 'var(--text-muted)' }}>{copy.loadingSubmissions}</div>
        ) : submissions.length === 0 ? (
          <EmptyState title={copy.noSubmissions} message={copy.noSubmissionsMessage} />
        ) : (
          <div className="space-y-3">
            {submissions.map(item => <SubmissionRow key={item.id} submission={item} onGrade={gradeSubmission} copy={copy} />)}
          </div>
        )}
      </Modal>

      <section className="card p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(circle at top right, rgba(124,58,237,0.18), transparent 40%)' }} />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-faint)' }}>{copy.hub}</p>
            <h2 className="text-[26px] font-extrabold mt-2" style={{ color: 'var(--text)' }}>{copy.heroTitle}</h2>
            <p className="text-[13px] mt-3 max-w-[680px]" style={{ color: 'var(--text-muted)' }}>{copy.heroSubtitle}</p>
          </div>
          {canManage && <button onClick={() => setShowCreate(true)} className="btn-primary px-4 py-2.5 text-[13px]" style={{ borderRadius: 12 }}>{copy.createAssignment}</button>}
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: copy.total, value: summary.total, color: '#a78bfa' },
          { label: copy.pending, value: summary.pending, color: '#fbbf24' },
          { label: copy.submitted, value: summary.submitted, color: '#60a5fa' },
          { label: copy.late, value: summary.late, color: '#f87171' },
          { label: copy.graded, value: summary.graded, color: '#10b981' },
        ].map(item => (
          <div key={item.label} className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{item.label}</p>
            <p className="text-[24px] font-extrabold mt-2" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </section>

      <section className="card p-4">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(item => (
            <button key={item} onClick={() => setFilter(item)} className="px-3 py-1.5 rounded-lg text-[12px] font-medium capitalize" style={{ background: filter === item ? 'rgba(124,58,237,0.16)' : 'transparent', color: filter === item ? '#a78bfa' : 'var(--text-muted)', border: `1px solid ${filter === item ? 'rgba(124,58,237,0.32)' : 'var(--border)'}` }}>
              {copy.filters[item]}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="card p-8 text-[13px]" style={{ color: 'var(--text-muted)' }}>{copy.loading}</div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState title={copy.noAssignments} message={copy.noAssignmentsMessage} /></div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(item => {
            const tone = getStatusTone(item.submission?.status || 'pending', copy)
            return (
              <button key={item.id} onClick={() => openDetails(item)} className="card p-5 text-left transition-all hover:translate-y-[-2px]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{item.title}</p>
                    <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>{item.class?.name || item.teacher?.name}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ color: tone.color, background: tone.bg }}>{tone.label}</span>
                </div>
                <p className="text-[12px] mt-4 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{item.description || copy.noDescription}</p>
                <div className="flex items-center justify-between mt-5 text-[11px]">
                  <span style={{ color: 'var(--text-faint)' }}>{copy.due} {new Date(item.dueAt).toLocaleDateString(dateLocale)}</span>
                  <span style={{ color: 'var(--text)' }}>{item.maxScore} {copy.pts}</span>
                </div>
              </button>
            )
          })}
        </section>
      )}
    </div>
  )
}

function SubmissionRow({ submission, onGrade, copy }: { submission: Submission; onGrade: (submissionId: number, score: string, feedback: string) => Promise<void>; copy: ReturnType<typeof getCopy> }) {
  const [score, setScore] = useState(submission.score?.toString() || '')
  const [feedback, setFeedback] = useState(submission.feedback || '')
  const tone = getStatusTone(submission.status, copy)

  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{submission.student.name}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{submission.student.course}</p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ color: tone.color, background: tone.bg }}>{tone.label}</span>
      </div>
      {submission.fileUrl && <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="text-[11px]" style={{ color: '#a78bfa' }}>{copy.openFile}</a>}
      <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_120px] gap-2 mt-3">
        <input className="input" type="number" placeholder={copy.score} value={score} onChange={e => setScore(e.target.value)} />
        <input className="input" placeholder={copy.feedback} value={feedback} onChange={e => setFeedback(e.target.value)} />
        <button onClick={() => onGrade(submission.id, score, feedback)} className="btn-primary py-2 rounded-xl text-[12px]">{copy.gradeAction}</button>
      </div>
    </div>
  )
}
