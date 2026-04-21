import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from 'recharts'
import api from '../api/api'
import { useLocale } from '../hooks/useLocale'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import { Modal } from '../components/ui/Modal'
import { toast } from '../components/ui/Toast'

interface AttendanceRecord { date: string; status: string }
interface PaymentRecord { id: number; totalAmount: number; paidAmount: number; remaining: number; status: string; date: string; dueDate: string | null }
interface SubmissionRecord {
  id: number
  submittedAt: string | null
  status: string
  score: number | null
  assignment: { id: number; title: string; dueAt: string; maxScore: number; class: { name: string; code: string } | null }
}
interface SubjectRecord {
  id: number
  offeringId?: number
  semesterId?: number
  subjectId?: number
  name: string
  code: string
  credits: number
  teacher: string | null
  midtermScore?: number | null
  finalExamScore?: number | null
  courseworkScore?: number | null
  totalScore?: number | null
  score?: number | null
  gpa?: number | null
  grade?: string
  finalLetterGrade?: string
  passStatus?: 'PASS' | 'FAIL' | 'INCOMPLETE'
  calculationStatus?: string
  status: string
}
interface StudentDetails {
  id: number
  name: string
  course: string
  grade: string | null
  status: string
  joinedAt: string
  attendance: AttendanceRecord[]
  payments: PaymentRecord[]
  submissions: SubmissionRecord[]
  subjects: SubjectRecord[]
  academicSummary: {
    gpa: number | null
    averageScore: number | null
    averagePercentage: number | null
    gradedAssignments: number
    totalSubjects: number
    totalCredits: number
    totalRegisteredCredits?: number
    totalEarnedCredits?: number
    passedSubjects?: number
    failedSubjects?: number
    incompleteSubjects?: number
    letterGrade: string
    status: string
  }
}
interface AttendanceStats {
  totalClasses: number
  presentCount: number
  absentCount: number
  lateCount: number
  attendancePercentage: number
  absencePercentage: number
  indicator: 'SAFE' | 'WARNING' | 'RISK'
  indicatorLabel: string
}
interface AnalysisData {
  analysis: string
}

interface GoalState {
  targetGpa: string
}

interface SemesterRecord {
  id: number
  name: string
  code: string
}

interface OfferingRecord {
  id: number
  section: string
  semesterId: number
  subjectId: number
  subject: { id: number; name: string; code: string; creditHours: number }
  teacher: { id: number; name: string } | null
  gradingPolicy: {
    id: number
    name: string
    passMinScore: number
    components: Array<{
      id: number
      code: 'MIDTERM' | 'FINAL_EXAM' | 'COURSEWORK'
      label: string
      weight: number
      maxScore: number
      isRequired: boolean
      sortOrder: number
    }>
    boundaries: Array<{
      id: number
      letterGrade: string
      minScore: number
      maxScore: number | null
      gradePoint: number
      isPassing: boolean
      includeInGpa: boolean
      sortOrder: number
    }>
  }
}

interface ScoreDraft {
  midterm: string
  finalExam: string
  coursework: string
}

interface GradePreview {
  totalScore: number | null
  finalLetterGrade: string
  passStatus: 'PASS' | 'FAIL' | 'INCOMPLETE'
}

function buildWeightSummary(offering: OfferingRecord | null, locale: 'ar' | 'en') {
  if (!offering) return locale === 'ar' ? 'الميد 40% + الفاينل 60%' : 'Midterm 40% + Final 60%'

  const labels: Record<'MIDTERM' | 'FINAL_EXAM' | 'COURSEWORK', string> =
    locale === 'ar'
      ? { MIDTERM: 'الميد', FINAL_EXAM: 'الفاينل', COURSEWORK: 'الأعمال' }
      : { MIDTERM: 'Midterm', FINAL_EXAM: 'Final', COURSEWORK: 'Coursework' }

  const parts = [...offering.gradingPolicy.components]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .filter(component => Number(component.weight) > 0)
    .map(component => `${labels[component.code]} ${Number(component.weight)}%`)

  return parts.join(locale === 'ar' ? ' + ' : ' + ')
}

function toNumericInput(value: string) {
  if (value.trim() === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function calculateGradePreview(offering: OfferingRecord | null, scores: ScoreDraft): GradePreview {
  if (!offering) {
    return { totalScore: null, finalLetterGrade: 'N/A', passStatus: 'INCOMPLETE' }
  }

  let totalScore = 0
  let hasRequiredGap = false

  for (const component of offering.gradingPolicy.components) {
    const sourceValue =
      component.code === 'MIDTERM'
        ? scores.midterm
        : component.code === 'FINAL_EXAM'
          ? scores.finalExam
          : scores.coursework

    const rawScore = toNumericInput(sourceValue)

    if (rawScore === null) {
      if (component.isRequired) hasRequiredGap = true
      continue
    }

    const bounded = Math.min(Number(component.maxScore), Math.max(0, rawScore))
    totalScore += (bounded / Number(component.maxScore || 100)) * Number(component.weight || 0)
  }

  if (hasRequiredGap) {
    return { totalScore: null, finalLetterGrade: 'N/A', passStatus: 'INCOMPLETE' }
  }

  const normalizedTotal = Math.round((totalScore + Number.EPSILON) * 100) / 100
  const sortedBoundaries = [...offering.gradingPolicy.boundaries].sort((left, right) => right.minScore - left.minScore)
  const boundary = sortedBoundaries.find((item) => {
    const maxScore = item.maxScore ?? 100
    return normalizedTotal >= Number(item.minScore) && normalizedTotal <= Number(maxScore)
  })

  if (!boundary) {
    return { totalScore: normalizedTotal, finalLetterGrade: 'N/A', passStatus: 'INCOMPLETE' }
  }

  const passed = Boolean(boundary.isPassing) && normalizedTotal >= Number(offering.gradingPolicy.passMinScore)

  return {
    totalScore: normalizedTotal,
    finalLetterGrade: boundary.letterGrade,
    passStatus: passed ? 'PASS' : 'FAIL',
  }
}

function getIndicatorStyle(indicator: AttendanceStats['indicator'], locale: 'ar' | 'en') {
  if (indicator === 'RISK') return { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: locale === 'ar' ? 'خطر' : 'Risk' }
  if (indicator === 'WARNING') return { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: locale === 'ar' ? 'تحذير' : 'Warning' }
  return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: locale === 'ar' ? 'آمن' : 'Safe' }
}

function getRiskProbability(stats: AttendanceStats, gpa: number) {
  const absenceWeight = Math.min(65, stats.absentCount * 14)
  const gpaWeight = Math.max(0, 35 - Math.round((gpa / 4) * 35))
  return Math.min(97, absenceWeight + gpaWeight)
}

function getCopy(locale: 'ar' | 'en') {
  return locale === 'ar'
    ? {
        loading: 'جارٍ تحميل ملف الطالب...',
        notFound: 'الطالب غير موجود',
        notFoundMessage: 'تعذر تحميل ملف الطالب المطلوب.',
        backToStudents: 'العودة للطلاب',
        back: 'عودة',
        attendance: 'الحضور',
        absences: 'الغيابات',
        gpa: 'المعدل',
        paidTotal: 'إجمالي المدفوع',
        outstanding: 'المتبقي',
        attendanceProgress: 'تقدم الحضور',
        attendanceSubtitle: 'مؤشر الفصل والاتجاه الأخير',
        semesterAttendance: 'حضور الفصل',
        present: 'حاضر',
        late: 'متأخر',
        absent: 'غائب',
        academicSummary: 'الملخص الأكاديمي',
        academicSubtitle: 'المعدل الحالي واتجاه الدرجات والحمل الدراسي',
        currentGpa: 'المعدل الحالي',
        letterGrade: 'التقدير الحرفي',
        subjects: 'المواد',
        credits: 'الساعات',
        goalTracking: 'تتبع الهدف',
        goalSubtitle: 'تابع الهدف الأكاديمي لهذا الطالب',
        targetGpa: 'المعدل المستهدف',
        ofTarget: 'من الهدف تم إنجازه',
        aiSummary: 'الملخص الذكي',
        aiSubtitle: 'نقاط القوة والمخاطر باختصار',
        noAiSummary: 'لا يوجد ملخص ذكي بعد.',
        assignmentSnapshot: 'ملخص الواجبات',
        assignmentSubtitle: 'آخر التسليمات والتقييمات',
        noAssignments: 'لا توجد واجبات مسلمة بعد.',
        due: 'الاستحقاق',
        riskAnalysis: 'تحليل المخاطر',
        riskSubtitle: 'احتمالية الصعوبة الأكاديمية الحالية',
        failureProbability: 'احتمالية التعثر',
        highRisk: 'خطر مرتفع',
        moderateRisk: 'خطر متوسط',
        lowRisk: 'خطر منخفض',
        primaryReason: 'السبب الرئيسي',
        exceededReason: 'تجاوز الغياب الحد الفصلي',
        nearReason: 'الغياب قريب من الحد الفصلي',
        belowTargetReason: 'الأداء الأكاديمي أقل من الهدف',
        stableReason: 'الأداء مستقر',
        subjectsTitle: 'المواد',
        subjectsSubtitle: 'الحمل الأكاديمي والدرجات والأداء لكل مادة',
        noSubjects: 'لا توجد مواد بعد',
        noSubjectsMessage: 'ستظهر المواد عند تسجيل الطالب في الصفوف.',
        name: 'الاسم',
        code: 'الرمز',
        grade: 'التقدير',
        score: 'النتيجة',
        status: 'الحالة',
        teacherMissing: 'لم يحدد المعلم بعد',
        paymentHistory: 'سجل المدفوعات',
        paymentSubtitle: 'المدفوع مقابل الرصيد المتبقي',
        noPaymentHistory: 'لا يوجد سجل مدفوعات',
        noPaymentHistoryMessage: 'ستظهر المدفوعات هنا بعد تسجيلها.',
        latestPaymentRecords: 'أحدث سجلات المدفوعات',
        paymentRecordsSubtitle: 'آخر الفواتير والأرصدة',
        noPaymentRecords: 'لا توجد سجلات مدفوعات',
        noPaymentRecordsMessage: 'لم يتم إصدار أي رسوم لهذا الطالب بعد.',
        dueInline: 'استحقاق',
        currency: 'ر.س',
      }
    : {
        loading: 'Loading student profile...',
        notFound: 'Student not found',
        notFoundMessage: 'The requested student profile could not be loaded.',
        backToStudents: 'Back to students',
        back: 'Back',
        attendance: 'Attendance',
        absences: 'Absences',
        gpa: 'GPA',
        paidTotal: 'Paid Total',
        outstanding: 'Outstanding',
        attendanceProgress: 'Attendance Progress',
        attendanceSubtitle: 'Current semester indicator and recent trend',
        semesterAttendance: 'Semester attendance',
        present: 'present',
        late: 'late',
        absent: 'absent',
        academicSummary: 'Academic Summary',
        academicSubtitle: 'Current GPA, grade trend, and subject load',
        currentGpa: 'Current GPA',
        letterGrade: 'Letter Grade',
        subjects: 'Subjects',
        credits: 'Credits',
        goalTracking: 'Goal Tracking',
        goalSubtitle: 'Track academic target progress for this student',
        targetGpa: 'Target GPA',
        ofTarget: 'of target reached',
        aiSummary: 'AI Summary',
        aiSubtitle: 'Concise strengths and risks',
        noAiSummary: 'No AI summary available yet.',
        assignmentSnapshot: 'Assignment Snapshot',
        assignmentSubtitle: 'Recent submissions and grading',
        noAssignments: 'No assignments submitted yet.',
        due: 'Due',
        riskAnalysis: 'Risk Analysis',
        riskSubtitle: 'Current probability of academic difficulty',
        failureProbability: 'Failure probability',
        highRisk: 'High risk',
        moderateRisk: 'Moderate risk',
        lowRisk: 'Low risk',
        primaryReason: 'Primary reason',
        exceededReason: 'absence exceeded the semester threshold',
        nearReason: 'absence is near the semester threshold',
        belowTargetReason: 'academic performance is below target',
        stableReason: 'performance is stable',
        subjectsTitle: 'Subjects',
        subjectsSubtitle: 'Academic load, grades, and performance by subject',
        noSubjects: 'No subjects yet',
        noSubjectsMessage: 'Subjects will appear once the student is enrolled in classes.',
        name: 'Name',
        code: 'Code',
        grade: 'Grade',
        score: 'Score',
        status: 'Status',
        teacherMissing: 'Teacher not assigned',
        paymentHistory: 'Payment History',
        paymentSubtitle: 'Paid amounts versus outstanding balance',
        noPaymentHistory: 'No payment history',
        noPaymentHistoryMessage: 'Payments will appear here once recorded.',
        latestPaymentRecords: 'Latest Payment Records',
        paymentRecordsSubtitle: 'Recent invoices and balances',
        noPaymentRecords: 'No payment records',
        noPaymentRecordsMessage: 'Nothing has been billed for this student yet.',
        dueInline: 'due',
        currency: 'SAR',
      }
}

export default function StudentProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { locale } = useLocale()
  const copy = useMemo(() => getCopy(locale), [locale])
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [aiSummary, setAiSummary] = useState('')
  const [goal, setGoal] = useState<GoalState>({ targetGpa: '3.5' })
  const [semesters, setSemesters] = useState<SemesterRecord[]>([])
  const [offerings, setOfferings] = useState<OfferingRecord[]>([])
  const [managementOpen, setManagementOpen] = useState(false)
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [selectedOfferingId, setSelectedOfferingId] = useState('')
  const [assignmentDraft, setAssignmentDraft] = useState<ScoreDraft>({ midterm: '', finalExam: '', coursework: '' })
  const [enrollmentLoading, setEnrollmentLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [subjectSavingId, setSubjectSavingId] = useState<number | null>(null)
  const [scoreDrafts, setScoreDrafts] = useState<Record<number, ScoreDraft>>({})
  const [loading, setLoading] = useState(true)
  const canManageAcademic = user?.role === 'ADMIN' || user?.role === 'TEACHER'
  const canEnrollSubjects = user?.role === 'ADMIN'
  const manageAcademicLabel = locale === 'ar' ? 'إدارة المواد والدرجات' : 'Manage Academics'
  const assignSubjectLabel = locale === 'ar' ? 'إسناد مادة' : 'Assign Subject'
  const assignAndContinueLabel = locale === 'ar' ? 'إسناد + إضافة أخرى' : 'Assign & Add Another'
  const addAnotherSubjectLabel = locale === 'ar' ? 'إضافة مادة أخرى' : 'Add Another Subject'
  const saveScoresLabel = locale === 'ar' ? 'حفظ الدرجات' : 'Save Scores'
  const semesterLabel = locale === 'ar' ? 'الفصل' : 'Semester'
  const offeringLabel = locale === 'ar' ? 'المادة المطروحة' : 'Subject Offering'
  const selectLabel = locale === 'ar' ? 'اختر' : 'Select'
  const savedLabel = locale === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully'
  const savedErrorLabel = locale === 'ar' ? 'تعذر حفظ الدرجات' : 'Failed to save grades'
  const assignSuccessLabel = locale === 'ar' ? 'تم إسناد المادة بنجاح' : 'Subject assigned successfully'
  const assignErrorLabel = locale === 'ar' ? 'تعذر إسناد المادة' : 'Failed to assign subject'
  const workingLabel = locale === 'ar' ? 'جارٍ التنفيذ...' : 'Working...'
  const cancelLabel = locale === 'ar' ? 'إلغاء' : 'Cancel'
  const midtermLabel = locale === 'ar' ? 'درجة الميد' : 'Midterm Score'
  const finalExamLabel = locale === 'ar' ? 'درجة الفاينل' : 'Final Exam Score'
  const courseworkLabel = locale === 'ar' ? 'الأعمال / الكويزات' : 'Coursework / Quiz'
  const totalScoreLabel = locale === 'ar' ? 'المجموع النهائي' : 'Total Score'
  const computedGradeLabel = locale === 'ar' ? 'التقدير النهائي المحسوب' : 'Computed Final Grade'
  const passStatusLabel = locale === 'ar' ? 'حالة النجاح' : 'Pass / Fail'
  const autoCalcLabel = locale === 'ar' ? 'يتم حساب التقدير النهائي تلقائيًا من الدرجات المدخلة' : 'Final grade is calculated automatically from the entered scores'
  const weightsLabel = locale === 'ar' ? 'معادلة الحساب' : 'Calculation Rule'
  const courseworkHintLabel = locale === 'ar' ? 'الأعمال اختيارية ولن تؤثر إلا إذا كانت ضمن سياسة المادة.' : 'Coursework is optional and only affects the result when included in the subject policy.'
  const incompleteLabel = locale === 'ar' ? 'غير مكتمل' : 'Incomplete'
  const passLabel = locale === 'ar' ? 'ناجح' : 'Pass'
  const failLabel = locale === 'ar' ? 'راسب' : 'Fail'
  const syncAcademicLabel = locale === 'ar' ? 'مزامنة البيانات الأكاديمية' : 'Sync Academic Data'
  const syncAcademicSuccessLabel = locale === 'ar' ? 'تمت مزامنة البيانات الأكاديمية' : 'Academic data synced successfully'
  const syncAcademicErrorLabel = locale === 'ar' ? 'فشلت مزامنة البيانات الأكاديمية' : 'Failed to sync academic data'

  const loadStudentData = async () => {
    const [studentRes, statsRes, aiRes] = await Promise.all([
      api.get(`/students/${id}`),
      api.get(`/attendance/student/${id}/stats`),
      api.get(`/ai/analyze/${id}`).catch(() => ({ data: { analysis: '' } })),
    ])

    setStudent(studentRes.data.student)
    setStats(statsRes.data)
    setAiSummary((aiRes.data as AnalysisData).analysis || '')
  }

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        setLoading(true)
        const [studentRes, statsRes, aiRes] = await Promise.all([
          api.get(`/students/${id}`),
          api.get(`/attendance/student/${id}/stats`),
          api.get(`/ai/analyze/${id}`).catch(() => ({ data: { analysis: '' } })),
        ])
        if (!active) return
        setStudent(studentRes.data.student)
        setStats(statsRes.data)
        setAiSummary((aiRes.data as AnalysisData).analysis || '')
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (!id) return
    const saved = window.localStorage.getItem(`student-goal-${id}`)
    if (saved) setGoal(JSON.parse(saved) as GoalState)
  }, [id])

  useEffect(() => {
    if (!id) return
    window.localStorage.setItem(`student-goal-${id}`, JSON.stringify(goal))
  }, [goal, id])

  useEffect(() => {
    if (!student) return

    setScoreDrafts(
      Object.fromEntries(
        student.subjects.map(subject => [
          subject.id,
          {
            midterm: subject.midtermScore?.toString() ?? '',
            finalExam: subject.finalExamScore?.toString() ?? '',
            coursework: subject.courseworkScore?.toString() ?? '',
          },
        ]),
      ),
    )
  }, [student])

  useEffect(() => {
    if (!student || location.hash !== '#subjects') return
    const section = document.getElementById('subjects')
    if (!section) return
    const raf = window.requestAnimationFrame(() => {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => window.cancelAnimationFrame(raf)
  }, [student, location.hash])

  useEffect(() => {
    if (!managementOpen || !canEnrollSubjects) return

    let active = true

    ;(async () => {
      try {
        const [semesterRes, offeringRes] = await Promise.all([
          api.get('/academic/semesters'),
          api.get('/academic/offerings'),
        ])

        if (!active) return
        setSemesters(semesterRes.data.semesters ?? [])
        setOfferings(offeringRes.data.offerings ?? [])
      } catch {
        if (!active) return
        toast.error(assignErrorLabel)
      }
    })()

    return () => { active = false }
  }, [managementOpen, canEnrollSubjects, assignErrorLabel])

  useEffect(() => {
    setAssignmentDraft({ midterm: '', finalExam: '', coursework: '' })
  }, [selectedOfferingId])

  const dateLocale = locale === 'ar' ? 'ar' : 'en-GB'

  const attendanceTrend = useMemo(() => {
    if (!student) return []
    return [...student.attendance]
      .slice(0, 8)
      .reverse()
      .map(item => ({
        date: new Date(item.date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' }),
        value: item.status === 'present' ? 100 : item.status === 'late' ? 65 : 0,
      }))
  }, [student, dateLocale])

  const paymentChart = useMemo(() => {
    if (!student) return []
    return student.payments.slice(0, 5).reverse().map(item => ({
      label: new Date(item.date).toLocaleDateString(dateLocale, { month: 'short' }),
      paid: item.paidAmount,
      left: item.remaining,
    }))
  }, [student, dateLocale])

  const projectedGpa = useMemo(() => {
    if (!student || student.submissions.length === 0) return null
    const graded = student.submissions.filter(item => item.score !== null)
    if (graded.length === 0) return null
    const average = graded.reduce((sum, item) => sum + ((item.score || 0) / item.assignment.maxScore) * 4, 0) / graded.length
    return Math.round(average * 100) / 100
  }, [student])

  const availableOfferings = useMemo(() => {
    if (!student) return []

    const assignedOfferingIds = new Set(student.subjects.map(subject => subject.offeringId).filter(Boolean))
    const assignedSubjectKeys = new Set(student.subjects.map(subject => `${subject.subjectId}-${subject.semesterId}`))

    return offerings.filter(offering => {
      if (selectedSemesterId && offering.semesterId !== Number(selectedSemesterId)) return false
      if (assignedOfferingIds.has(offering.id)) return false
      return !assignedSubjectKeys.has(`${offering.subjectId}-${offering.semesterId}`)
    })
  }, [offerings, selectedSemesterId, student])

  const selectedOffering = useMemo(
    () => availableOfferings.find(offering => offering.id === Number(selectedOfferingId)) || null,
    [availableOfferings, selectedOfferingId],
  )

  const assignmentPreview = useMemo(
    () => calculateGradePreview(selectedOffering, assignmentDraft),
    [selectedOffering, assignmentDraft],
  )
  const weightSummary = useMemo(
    () => buildWeightSummary(selectedOffering, locale),
    [selectedOffering, locale],
  )

  function closeManagementModal() {
    setManagementOpen(false)
    setSelectedSemesterId('')
    setSelectedOfferingId('')
    setAssignmentDraft({ midterm: '', finalExam: '', coursework: '' })
  }

  async function handleAssignSubject(keepOpen = false) {
    if (!id || !selectedOfferingId) return

    try {
      setEnrollmentLoading(true)
      await api.post('/academic/enrollments', {
        studentId: Number(id),
        subjectOfferingId: Number(selectedOfferingId),
        scores: {
          midterm: toNumericInput(assignmentDraft.midterm),
          finalExam: toNumericInput(assignmentDraft.finalExam),
          coursework: toNumericInput(assignmentDraft.coursework),
        },
      })
      await loadStudentData()
      if (keepOpen) {
        setSelectedOfferingId('')
        setAssignmentDraft({ midterm: '', finalExam: '', coursework: '' })
      } else {
        closeManagementModal()
      }
      toast.success(assignSuccessLabel)
    } catch {
      toast.error(assignErrorLabel)
    } finally {
      setEnrollmentLoading(false)
    }
  }

  async function handleSaveScores(subject: SubjectRecord) {
    const draft = scoreDrafts[subject.id]
    if (!draft) return

    const toPayload = (value: string) => value.trim() === '' ? null : Number(value)

    try {
      setSubjectSavingId(subject.id)
      await Promise.all([
        api.patch(`/academic/enrollments/${subject.id}/assessments/midterm`, { rawScore: toPayload(draft.midterm) }),
        api.patch(`/academic/enrollments/${subject.id}/assessments/final`, { rawScore: toPayload(draft.finalExam) }),
        api.patch(`/academic/enrollments/${subject.id}/assessments/coursework`, { rawScore: toPayload(draft.coursework) }),
      ])
      await loadStudentData()
      toast.success(savedLabel)
    } catch {
      toast.error(savedErrorLabel)
    } finally {
      setSubjectSavingId(null)
    }
  }

  async function handleSyncAcademicData() {
    if (!user || user.role !== 'ADMIN') return

    try {
      setSyncLoading(true)
      await api.post('/academic/bootstrap')
      await loadStudentData()
      toast.success(syncAcademicSuccessLabel)
    } catch {
      toast.error(syncAcademicErrorLabel)
    } finally {
      setSyncLoading(false)
    }
  }

  if (loading) {
    return <div className="card p-8 text-[13px]" style={{ color: 'var(--text-muted)' }}>{copy.loading}</div>
  }

  if (!student || !stats) {
    return <div className="card"><EmptyState title={copy.notFound} message={copy.notFoundMessage} action={{ label: copy.backToStudents, onClick: () => navigate('/students') }} /></div>
  }

  const tone = getIndicatorStyle(stats.indicator, locale)
  const paidTotal = student.payments.reduce((sum, item) => sum + item.paidAmount, 0)
  const dueTotal = student.payments.reduce((sum, item) => sum + item.remaining, 0)
  const actualGpa = student.academicSummary?.gpa ?? null
  const activeGpa = actualGpa ?? projectedGpa
  const gpaValue = activeGpa === null ? 'N/A' : activeGpa.toFixed(2)
  const goalTarget = Number(goal.targetGpa || 0)
  const goalProgress = activeGpa !== null && goalTarget > 0 ? Math.min(100, Math.round((activeGpa / goalTarget) * 100)) : 0
  const riskProbability = getRiskProbability(stats, activeGpa ?? 0)
  const statusLabel = stats.indicator === 'RISK' ? copy.highRisk : stats.indicator === 'WARNING' ? copy.moderateRisk : copy.lowRisk
  const riskReason =
    stats.absentCount > 4 ? copy.exceededReason
      : stats.absentCount >= 3 ? copy.nearReason
        : activeGpa !== null && activeGpa < goalTarget ? copy.belowTargetReason
          : copy.stableReason
  const formatScore = (value?: number | null, suffix = '') => value === null || value === undefined ? 'N/A' : `${value.toFixed(1)}${suffix}`
  const subjectHeaders = locale === 'ar'
    ? ['المادة', 'الرمز', 'الساعات', 'النصفي', 'النهائي', 'الأعمال', 'المجموع', 'التقدير النهائي', 'الحالة']
    : ['Subject', 'Code', 'Credits', 'Midterm', 'Final Exam', 'Coursework', 'Total', 'Final Grade', 'Status']
  const subjectsSection = (
    <section id="subjects" className="card overflow-hidden">
      <div className="px-5 py-4 flex items-start justify-between gap-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.subjectsTitle}</h3>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{copy.subjectsSubtitle}</p>
        </div>
        {canEnrollSubjects && (
          <button onClick={() => setManagementOpen(true)} className="btn-primary px-3 py-2 text-[12px] rounded-xl">
            {addAnotherSubjectLabel}
          </button>
        )}
      </div>
      {student.subjects.length === 0 ? (
        <div className="p-4">
          <EmptyState
            title={copy.noSubjects}
            message={copy.noSubjectsMessage}
            action={user?.role === 'ADMIN' ? { label: addAnotherSubjectLabel, onClick: () => setManagementOpen(true) } : undefined}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {subjectHeaders.map(header => (
                  <th key={header} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {student.subjects.map(subject => {
                const finalGrade = subject.finalLetterGrade || subject.grade || 'N/A'
                const scoreTone =
                  subject.passStatus === 'PASS' ? 'badge-success'
                    : subject.passStatus === 'FAIL' ? 'badge-error'
                      : 'badge-purple'

                return (
                  <tr key={subject.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{subject.name}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{subject.teacher || copy.teacherMissing}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[12px]" style={{ color: 'var(--text-muted)' }}>{subject.code}</td>
                    <td className="px-5 py-4 text-[12px]" style={{ color: 'var(--text)' }}>{subject.credits}</td>
                    <td className="px-5 py-4 text-[12px]" style={{ color: 'var(--text)' }}>
                      {canManageAcademic ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={scoreDrafts[subject.id]?.midterm ?? ''}
                          onChange={e => setScoreDrafts(current => ({ ...current, [subject.id]: { ...(current[subject.id] || { midterm: '', finalExam: '', coursework: '' }), midterm: e.target.value } }))}
                          className="input px-2 py-1 h-9 text-[12px]"
                        />
                      ) : formatScore(subject.midtermScore)}
                    </td>
                    <td className="px-5 py-4 text-[12px]" style={{ color: 'var(--text)' }}>
                      {canManageAcademic ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={scoreDrafts[subject.id]?.finalExam ?? ''}
                          onChange={e => setScoreDrafts(current => ({ ...current, [subject.id]: { ...(current[subject.id] || { midterm: '', finalExam: '', coursework: '' }), finalExam: e.target.value } }))}
                          className="input px-2 py-1 h-9 text-[12px]"
                        />
                      ) : formatScore(subject.finalExamScore)}
                    </td>
                    <td className="px-5 py-4 text-[12px]" style={{ color: 'var(--text)' }}>
                      {canManageAcademic ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={scoreDrafts[subject.id]?.coursework ?? ''}
                          onChange={e => setScoreDrafts(current => ({ ...current, [subject.id]: { ...(current[subject.id] || { midterm: '', finalExam: '', coursework: '' }), coursework: e.target.value } }))}
                          className="input px-2 py-1 h-9 text-[12px]"
                        />
                      ) : formatScore(subject.courseworkScore)}
                    </td>
                    <td className="px-5 py-4 text-[12px]" style={{ color: 'var(--text)' }}>{formatScore(subject.totalScore, '%')}</td>
                    <td className="px-5 py-4">
                      <span className={`badge ${finalGrade.startsWith('A') ? 'badge-success' : finalGrade.startsWith('B') ? 'badge-info' : finalGrade === 'N/A' ? 'badge-purple' : 'badge-warning'}`}>{finalGrade}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-2">
                        <span className={`badge ${scoreTone}`}>{subject.status}</span>
                        {canManageAcademic && (
                          <button onClick={() => void handleSaveScores(subject)} disabled={subjectSavingId === subject.id} className="btn-ghost px-3 py-1.5 text-[11px]">
                            {subjectSavingId === subject.id ? workingLabel : saveScoresLabel}
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
      )}
    </section>
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <Modal
        open={managementOpen && canEnrollSubjects}
        onClose={closeManagementModal}
        title={manageAcademicLabel}
        footer={
          <div className="flex gap-2.5">
            <button onClick={closeManagementModal} className="btn-ghost flex-1 py-2.5 text-[13px] rounded-xl">{cancelLabel}</button>
            <button onClick={() => void handleAssignSubject(true)} disabled={enrollmentLoading || !selectedOfferingId} className="btn-ghost flex-1 py-2.5 text-[13px] rounded-xl">
              {enrollmentLoading ? workingLabel : assignAndContinueLabel}
            </button>
            <button onClick={() => void handleAssignSubject()} disabled={enrollmentLoading || !selectedOfferingId} className="btn-primary flex-1 py-2.5 text-[13px] rounded-xl">
              {enrollmentLoading ? workingLabel : assignSubjectLabel}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl px-3.5 py-3 text-[12px]" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)', color: 'var(--text-muted)' }}>
            {autoCalcLabel}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
              <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{weightsLabel}</p>
              <p className="text-[14px] font-semibold mt-1" style={{ color: 'var(--text)' }}>{weightSummary}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
              <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{courseworkLabel}</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>{courseworkHintLabel}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{semesterLabel}</label>
            <select value={selectedSemesterId} onChange={e => { setSelectedSemesterId(e.target.value); setSelectedOfferingId('') }} className="input">
              <option value="">{selectLabel}</option>
              {semesters.map(semester => (
                <option key={semester.id} value={semester.id}>{semester.name} ({semester.code})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{offeringLabel}</label>
            <select value={selectedOfferingId} onChange={e => setSelectedOfferingId(e.target.value)} className="input">
              <option value="">{selectLabel}</option>
              {availableOfferings.map(offering => (
                <option key={offering.id} value={offering.id}>
                  {offering.subject.name} ({offering.subject.code}) - {offering.section}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{midtermLabel}</label>
              <input
                type="number"
                min={0}
                max={selectedOffering?.gradingPolicy.components.find(item => item.code === 'MIDTERM')?.maxScore ?? 100}
                value={assignmentDraft.midterm}
                onChange={e => setAssignmentDraft(current => ({ ...current, midterm: e.target.value }))}
                className="input"
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{finalExamLabel}</label>
              <input
                type="number"
                min={0}
                max={selectedOffering?.gradingPolicy.components.find(item => item.code === 'FINAL_EXAM')?.maxScore ?? 100}
                value={assignmentDraft.finalExam}
                onChange={e => setAssignmentDraft(current => ({ ...current, finalExam: e.target.value }))}
                className="input"
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{courseworkLabel}</label>
              <input
                type="number"
                min={0}
                max={selectedOffering?.gradingPolicy.components.find(item => item.code === 'COURSEWORK')?.maxScore ?? 100}
                value={assignmentDraft.coursework}
                onChange={e => setAssignmentDraft(current => ({ ...current, coursework: e.target.value }))}
                className="input"
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: totalScoreLabel, value: assignmentPreview.totalScore === null ? 'N/A' : `${assignmentPreview.totalScore.toFixed(2)}%`, tone: '#60a5fa' },
              { label: computedGradeLabel, value: assignmentPreview.finalLetterGrade, tone: '#10b981' },
              { label: passStatusLabel, value: assignmentPreview.passStatus === 'PASS' ? passLabel : assignmentPreview.passStatus === 'FAIL' ? failLabel : incompleteLabel, tone: assignmentPreview.passStatus === 'PASS' ? '#10b981' : assignmentPreview.passStatus === 'FAIL' ? '#f87171' : '#fbbf24' },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{item.label}</p>
                <p className="text-[18px] font-bold mt-1" style={{ color: item.tone }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <section className="card p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(circle at top right, rgba(124,58,237,0.2), transparent 40%)' }} />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[18px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)' }}>
              {student.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-[26px] font-extrabold" style={{ color: 'var(--text)' }}>{student.name}</h2>
              <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>{student.course}{student.grade ? ` · ${student.grade}` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge ${student.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{student.status}</span>
            <span className="px-3 py-1.5 rounded-full text-[11px] font-semibold" style={{ color: tone.color, background: tone.bg }}>{tone.label}</span>
            {user?.role === 'ADMIN' && <button onClick={() => void handleSyncAcademicData()} disabled={syncLoading} className="btn-ghost px-3 py-1.5 text-[12px]">{syncLoading ? workingLabel : syncAcademicLabel}</button>}
            {canEnrollSubjects && <button onClick={() => setManagementOpen(true)} className="btn-ghost px-3 py-1.5 text-[12px]">{manageAcademicLabel}</button>}
            <button onClick={() => navigate('/students')} className="btn-ghost px-3 py-1.5 text-[12px]">{copy.back}</button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: copy.attendance, value: `${stats.attendancePercentage}%`, color: '#10b981' },
          { label: copy.absences, value: `${stats.absentCount}/4`, color: tone.color },
          { label: copy.gpa, value: gpaValue, color: activeGpa !== null && activeGpa >= 3 ? '#a78bfa' : '#fbbf24' },
          { label: copy.paidTotal, value: `${paidTotal.toLocaleString()} ${copy.currency}`, color: '#60a5fa' },
          { label: copy.outstanding, value: `${dueTotal.toLocaleString()} ${copy.currency}`, color: '#f87171' },
        ].map(item => (
          <div key={item.label} className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{item.label}</p>
            <p className="text-[24px] font-extrabold mt-2" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </section>

      {subjectsSection}

      <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.attendanceProgress}</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.attendanceSubtitle}</p>
            </div>
            <span className="text-[12px] font-semibold" style={{ color: tone.color }}>{stats.indicatorLabel}</span>
          </div>
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{copy.semesterAttendance}</span>
              <span className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>{stats.attendancePercentage}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{ width: `${stats.attendancePercentage}%`, background: tone.color }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px]" style={{ color: 'var(--text-faint)' }}>
              <span>{stats.presentCount} {copy.present}</span>
              <span>{stats.lateCount} {copy.late}</span>
              <span>{stats.absentCount} {copy.absent}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={attendanceTrend}>
              <defs>
                <linearGradient id="studentAttendanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tone.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={tone.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke={tone.color} fill="url(#studentAttendanceGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.academicSummary}</h3>
            <p className="text-[11px] mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>{copy.academicSubtitle}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: copy.currentGpa, value: gpaValue, color: '#a78bfa' },
                { label: copy.letterGrade, value: student.academicSummary?.letterGrade || 'N/A', color: '#10b981' },
                { label: copy.subjects, value: student.academicSummary?.totalSubjects || 0, color: '#60a5fa' },
                { label: copy.credits, value: student.academicSummary?.totalEarnedCredits ?? student.academicSummary?.totalCredits ?? 0, color: '#fbbf24' },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                  <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{item.label}</p>
                  <p className="text-[18px] font-bold mt-1" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.goalTracking}</h3>
            <p className="text-[11px] mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>{copy.goalSubtitle}</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input className="input" style={{ maxWidth: 160 }} value={goal.targetGpa} onChange={e => setGoal({ targetGpa: e.target.value })} placeholder={copy.targetGpa} />
                <div>
                  <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{copy.currentGpa}</p>
                  <p className="text-[18px] font-bold" style={{ color: activeGpa !== null && activeGpa >= goalTarget ? '#10b981' : '#a78bfa' }}>{gpaValue}</p>
                </div>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: `${goalProgress}%`, background: goalProgress >= 100 ? '#10b981' : '#a78bfa' }} />
              </div>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{goalProgress}% {copy.ofTarget}</p>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.aiSummary}</h3>
            <p className="text-[11px] mt-1 mb-3" style={{ color: 'var(--text-muted)' }}>{copy.aiSubtitle}</p>
            <div className="rounded-2xl p-4 text-[13px] leading-7 whitespace-pre-wrap" dir="rtl" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.16)', color: 'var(--text)', textAlign: 'right' }}>
              {aiSummary || copy.noAiSummary}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.assignmentSnapshot}</h3>
            <p className="text-[11px] mt-1 mb-3" style={{ color: 'var(--text-muted)' }}>{copy.assignmentSubtitle}</p>
            <div className="space-y-2.5">
              {student.submissions.length === 0 ? (
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{copy.noAssignments}</p>
              ) : student.submissions.slice(0, 4).map(item => (
                <div key={item.id} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>{item.assignment.title}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{item.assignment.class?.name || 'Class'}</p>
                    </div>
                    <span className={`badge ${item.status === 'graded' ? 'badge-success' : item.status === 'late' ? 'badge-error' : 'badge-warning'}`}>{item.status}</span>
                  </div>
                  <p className="text-[11px] mt-2" style={{ color: 'var(--text-faint)' }}>
                    {item.score !== null ? `${item.score}/${item.assignment.maxScore}` : `${copy.due} ${new Date(item.assignment.dueAt).toLocaleDateString(dateLocale)}`}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.riskAnalysis}</h3>
            <p className="text-[11px] mt-1 mb-3" style={{ color: 'var(--text-muted)' }}>{copy.riskSubtitle}</p>
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
              <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{copy.failureProbability}</p>
              <p className="text-[26px] font-extrabold mt-1" style={{ color: riskProbability >= 70 ? '#f87171' : riskProbability >= 45 ? '#fbbf24' : '#10b981' }}>{riskProbability}%</p>
              <p className="text-[18px] font-bold" style={{ color: stats.indicator === 'RISK' ? '#f87171' : stats.indicator === 'WARNING' ? '#fbbf24' : '#10b981' }}>
                {statusLabel}
              </p>
              <p className="text-[12px] mt-2" style={{ color: 'var(--text-muted)' }}>
                {copy.primaryReason}: {riskReason}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-4">
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.paymentHistory}</h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.paymentSubtitle}</p>
          </div>
          {paymentChart.length === 0 ? (
            <EmptyState title={copy.noPaymentHistory} message={copy.noPaymentHistoryMessage} />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={paymentChart} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="paid" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="left" fill="#f87171" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.latestPaymentRecords}</h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.paymentRecordsSubtitle}</p>
          </div>
          <div className="space-y-2.5">
            {student.payments.length === 0 ? (
              <EmptyState title={copy.noPaymentRecords} message={copy.noPaymentRecordsMessage} />
            ) : student.payments.slice(0, 5).map(item => (
              <div key={item.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>{item.paidAmount.toLocaleString()} / {item.totalAmount.toLocaleString()} {copy.currency}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {new Date(item.date).toLocaleDateString(dateLocale)}{item.dueDate ? ` · ${copy.dueInline} ${new Date(item.dueDate).toLocaleDateString(dateLocale)}` : ''}
                    </p>
                  </div>
                  <span className={`badge ${item.status === 'paid' ? 'badge-success' : item.status === 'overdue' ? 'badge-error' : item.status === 'partial' ? 'badge-info' : 'badge-warning'}`}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
