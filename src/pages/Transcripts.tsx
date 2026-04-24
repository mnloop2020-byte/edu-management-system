import { isAxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import { EmptyState } from '../components/ui/EmptyState'
import { toast } from '../components/ui/Toast'
import { useLocale } from '../hooks/useLocale'
import { localizeAcademicCode, localizeAcademicLabel } from '../utils/academicLocalization'
import { useAuth } from '../context/AuthContext'

interface StudentOption {
  id: number
  name: string
  course?: string
  status?: string
  subjectsCount?: number
  studentNumber?: string
}

interface TranscriptPayload {
  student: { id: number; name: string; course: string; status: string; joinedAt: string }
  summary: {
    gpa: number | null
    totalSubjects: number
    totalEarnedCredits: number
    attendanceRate: number
    paidAmount: number
    outstanding: number
    letterGrade: string
  }
  subjects: Array<{
    id: number
    name: string
    code: string
    credits: number
    totalScore: number | null
    finalLetterGrade: string
    status: string
  }>
}

function getCopy(locale: 'ar' | 'en') {
  return locale === 'ar'
    ? {
        loading: 'جارٍ تحميل كشوف الدرجات...',
        loadStudentsError: 'تعذر تحميل الطلاب',
        loadTranscriptError: 'تعذر تحميل كشف الدرجات',
        noStudents: 'لا يوجد طلاب',
        noStudentsMessage: 'قم بإضافة طلاب لعرض كشوف الدرجات.',
        title: 'مركز كشوف الدرجات',
        subtitle: 'ملخص أكاديمي جاهز للمراجعة والطباعة',
        print: 'طباعة',
        printSheetTitle: 'كشف الدرجات',
        printSheetSubtitle: 'ملخص أكاديمي واضح للطباعة',
        gpa: 'المعدل',
        letter: 'التقدير',
        subjects: 'المواد',
        credits: 'الساعات',
        attendance: 'الحضور',
        outstanding: 'الرسوم المستحقة',
        currency: 'ر.س',
        studentFilterTitle: 'بحث الطالب',
        classFilter: 'اختر الصف',
        allClasses: 'كل الصفوف',
        searchPlaceholder: 'ابحث باسم الطالب أو رقمه',
        studentSelect: 'اختر الطالب',
        noFilteredStudents: 'لا يوجد طلاب مطابقون',
        noFilteredStudentsMessage: 'غيّر الصف أو عبارة البحث للوصول إلى الطالب المطلوب.',
        studentNumber: 'رقم الطالب',
        notAvailable: 'غير متاح',
        pass: 'نجاح',
        fail: 'رسوب',
        inProgress: 'قيد المتابعة',
        tableHeaders: ['المادة', 'الرمز', 'الساعات', 'المجموع', 'التقدير النهائي', 'الحالة'] as string[],
      }
    : {
        loading: 'Loading transcripts...',
        loadStudentsError: 'Failed to load students',
        loadTranscriptError: 'Failed to load transcript',
        noStudents: 'No students available',
        noStudentsMessage: 'Create students to generate transcripts.',
        title: 'Transcript Center',
        subtitle: 'Academic summary ready for review and printing',
        print: 'Print',
        printSheetTitle: 'Transcript',
        printSheetSubtitle: 'Printable academic summary',
        gpa: 'GPA',
        letter: 'Letter',
        subjects: 'Subjects',
        credits: 'Credits',
        attendance: 'Attendance',
        outstanding: 'Outstanding',
        currency: 'SAR',
        studentFilterTitle: 'Student Search',
        classFilter: 'Select class',
        allClasses: 'All classes',
        searchPlaceholder: 'Search by student name or number',
        studentSelect: 'Select student',
        noFilteredStudents: 'No matching students',
        noFilteredStudentsMessage: 'Adjust the class or search query to find the target student.',
        studentNumber: 'Student Number',
        notAvailable: 'N/A',
        pass: 'Pass',
        fail: 'Fail',
        inProgress: 'In Progress',
        tableHeaders: ['Subject', 'Code', 'Credits', 'Total', 'Final Grade', 'Status'] as string[],
      }
}

function localizeStudentStatus(status: string, locale: 'ar' | 'en') {
  if (locale !== 'ar') return status

  const normalized = String(status || '').trim().toLowerCase()
  if (normalized === 'active') return 'نشط'
  if (normalized === 'on leave') return 'إجازة'
  if (normalized === 'inactive') return 'غير نشط'
  return status
}

function localizePassStatus(status: string, copy: ReturnType<typeof getCopy>) {
  const normalized = String(status || '').trim().toLowerCase()
  if (normalized === 'pass') return copy.pass
  if (normalized === 'fail') return copy.fail
  if (normalized === 'incomplete' || normalized === 'in progress') return copy.inProgress
  return status
}

export default function Transcripts() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const copy = getCopy(locale)
  const isStudent = String(user?.role || '').toUpperCase() === 'STUDENT'

  const [students, setStudents] = useState<StudentOption[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [transcript, setTranscript] = useState<TranscriptPayload | null>(null)
  const [loadingStudents, setLoadingStudents] = useState(true)

  const normalizedStudents = useMemo(() => {
    const seen = new Set<number>()
    return students
      .filter((student) => {
        if (!student || !Number.isFinite(student.id) || seen.has(student.id)) return false
        seen.add(student.id)
        return true
      })
      .map((student) => ({
        ...student,
        studentNumber: student.studentNumber || String(student.id).padStart(4, '0'),
      }))
  }, [students])

  const classOptions = useMemo(() => {
    const classes = new Set<string>()
    normalizedStudents.forEach((student) => {
      const className = String(student.course || '').trim()
      if (className) classes.add(className)
    })
    return [...classes].sort((left, right) => left.localeCompare(right))
  }, [normalizedStudents])

  const filteredStudents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return normalizedStudents.filter((student) => {
      const matchesClass = selectedClass === 'ALL' || String(student.course || '').trim() === selectedClass
      if (!matchesClass) return false
      if (!normalizedQuery) return true

      const studentNumber = String(student.studentNumber || student.id).toLowerCase()
      const studentId = String(student.id).toLowerCase()
      const studentName = String(student.name || '').toLowerCase()

      return (
        studentName.includes(normalizedQuery) ||
        studentNumber.includes(normalizedQuery) ||
        studentId.includes(normalizedQuery)
      )
    })
  }, [normalizedStudents, searchQuery, selectedClass])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoadingStudents(true)

        if (isStudent) {
          const res = await api.get('/transcripts/me')
          if (!active) return

          const ownTranscript = res.data as TranscriptPayload
          setTranscript(ownTranscript)
          setStudents([{
            id: ownTranscript.student.id,
            name: ownTranscript.student.name,
            course: ownTranscript.student.course,
            status: ownTranscript.student.status,
            subjectsCount: ownTranscript.summary.totalSubjects ?? ownTranscript.subjects.length,
            studentNumber: String(ownTranscript.student.id).padStart(4, '0'),
          }])
          setSelectedStudentId(String(ownTranscript.student.id))
          return
        }

        const [res, studentsRes] = await Promise.all([
          api.get('/transcripts/students'),
          api.get('/students').catch(() => ({ data: { students: [] } })),
        ])

        const fallbackStudentMap = new Map<number, StudentOption>(
          (studentsRes.data.students ?? []).map((item: StudentOption) => [item.id, item]),
        )

        if (!active) return

        const items = (res.data.students ?? []).map((item: StudentOption) => ({
          id: item.id,
          name: item.name,
          course: item.course || fallbackStudentMap.get(item.id)?.course,
          status: item.status || fallbackStudentMap.get(item.id)?.status,
          subjectsCount: item.subjectsCount ?? fallbackStudentMap.get(item.id)?.subjectsCount ?? 0,
          studentNumber: item.studentNumber || String(item.id).padStart(4, '0'),
        }))

        setStudents(items)
      } catch (error: unknown) {
        if (!active) return
        try {
          const fallbackRes = await api.get('/students')
          if (!active) return
          const fallbackItems = (fallbackRes.data.students ?? []).map((item: StudentOption) => ({
            id: item.id,
            name: item.name,
            course: item.course,
            status: item.status,
            subjectsCount: item.subjectsCount ?? 0,
            studentNumber: String(item.id).padStart(4, '0'),
          }))
          setStudents(fallbackItems)
        } catch {
          toast.error(
            isAxiosError(error)
              ? error.response?.data?.message || copy.loadStudentsError
              : copy.loadStudentsError,
          )
          setStudents([])
        }
      } finally {
        if (active) setLoadingStudents(false)
      }
    })()

    return () => { active = false }
  }, [copy.loadStudentsError, isStudent])

  useEffect(() => {
    if (isStudent) return

    if (filteredStudents.length === 0) {
      setSelectedStudentId('')
      setTranscript(null)
      return
    }

    const selectedStillVisible = filteredStudents.some((student) => String(student.id) === selectedStudentId)
    if (!selectedStillVisible) {
      setSelectedStudentId(String(filteredStudents[0].id))
    }
  }, [filteredStudents, selectedStudentId, isStudent])

  useEffect(() => {
    if (isStudent) return
    if (!selectedStudentId) return
    let active = true
    ;(async () => {
      try {
        const res = await api.get(`/transcripts/student/${selectedStudentId}`)
        if (!active) return
        setTranscript(res.data)
      } catch (error: unknown) {
        if (!active) return
        setTranscript(null)
        toast.error(
          isAxiosError(error)
            ? error.response?.data?.message || copy.loadTranscriptError
            : copy.loadTranscriptError,
        )
      }
    })()
    return () => { active = false }
  }, [selectedStudentId, copy.loadTranscriptError, isStudent])

  if (loadingStudents && normalizedStudents.length === 0) {
    return <div className="card p-6 text-[13px]" style={{ color: 'var(--text-muted)' }}>{copy.loading}</div>
  }

  if (!loadingStudents && normalizedStudents.length === 0) {
    return <div className="card"><EmptyState title={copy.noStudents} message={copy.noStudentsMessage} /></div>
  }

  return (
    <div className="space-y-5">
      <section className="card p-5 print-hide">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{copy.title}</h3>
            <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.subtitle}</p>
          </div>
          <button onClick={() => window.print()} className="btn-primary rounded-xl px-4 py-2 text-[12px]">{copy.print}</button>
        </div>

        {!isStudent && (
          <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[220px_1fr_320px]">
          <div className="space-y-2">
            <p className="text-[11px] font-medium" style={{ color: 'var(--text-faint)' }}>{copy.classFilter}</p>
            <select className="input" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="ALL">{copy.allClasses}</option>
              {classOptions.map((className) => (
                <option key={className} value={className}>
                  {localizeAcademicLabel(className, locale)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium" style={{ color: 'var(--text-faint)' }}>{copy.studentFilterTitle}</p>
            <input
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={copy.searchPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium" style={{ color: 'var(--text-faint)' }}>{copy.studentSelect}</p>
            <select
              className="input min-w-[260px]"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={filteredStudents.length === 0}
            >
              {filteredStudents.length === 0 ? (
                <option value="">{copy.noFilteredStudents}</option>
              ) : (
                filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} - #{student.studentNumber}
                  </option>
                ))
              )}
            </select>
          </div>
          </div>
        )}
      </section>

      {!isStudent && filteredStudents.length === 0 ? (
        <section className="card print-hide">
          <EmptyState title={copy.noFilteredStudents} message={copy.noFilteredStudentsMessage} />
        </section>
      ) : transcript && (
        <section className="card p-6 space-y-5 transcript-print-sheet">
          <div className="transcript-print-head">
            <h1>{copy.printSheetTitle}</h1>
            <p>{copy.printSheetSubtitle}</p>
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-[24px] font-extrabold" style={{ color: 'var(--text)' }}>{transcript.student.name}</h2>
              <p className="mt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {localizeAcademicLabel(transcript.student.course, locale)} - {localizeStudentStatus(transcript.student.status, locale)}
              </p>
            </div>

            <div className="rounded-2xl px-4 py-3 transcript-print-stat" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
              <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{copy.studentNumber}</p>
              <p className="mt-1 text-[16px] font-bold" style={{ color: 'var(--text)' }}>
                #{filteredStudents.find((student) => student.id === transcript.student.id)?.studentNumber || String(transcript.student.id).padStart(4, '0')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-6 transcript-print-stats">
            {[
              [copy.gpa, transcript.summary.gpa === null ? copy.notAvailable : transcript.summary.gpa.toFixed(2)],
              [copy.letter, transcript.summary.letterGrade || copy.notAvailable],
              [copy.subjects, transcript.summary.totalSubjects],
              [copy.credits, transcript.summary.totalEarnedCredits],
              [copy.attendance, `${transcript.summary.attendanceRate}%`],
              [copy.outstanding, `${transcript.summary.outstanding.toLocaleString()} ${copy.currency}`],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl p-4 transcript-print-stat" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{label}</p>
                <p className="mt-1 text-[18px] font-bold" style={{ color: 'var(--text)' }}>{value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] transcript-print-table">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {copy.tableHeaders.map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transcript.subjects.map((subject) => (
                  <tr key={subject.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text)' }}>{localizeAcademicLabel(subject.name, locale)}</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>{localizeAcademicCode(subject.code, locale)}</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text)' }}>{subject.credits}</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text)' }}>
                      {subject.totalScore === null ? copy.notAvailable : `${subject.totalScore.toFixed(1)}%`}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-purple">{subject.finalLetterGrade}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${subject.status === 'Pass' ? 'badge-success' : subject.status === 'Fail' ? 'badge-error' : 'badge-warning'}`}>
                        {localizePassStatus(subject.status, copy)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
