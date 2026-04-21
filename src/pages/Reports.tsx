import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../api/api'
import { useLocale } from '../hooks/useLocale'
import { SkeletonCard } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'

interface TooltipItem {
  color?: string
  fill?: string
  name: string
  value: number | string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipItem[]
  label?: string
}

interface StudentRecord {
  status: string
  grade: string | null
}

interface TeacherRecord {
  classes: number
}

interface PaymentRecord {
  status: 'paid' | 'pending' | 'overdue' | 'partial'
}

interface WeeklyAttendancePoint {
  day: string
  students: number
}

interface SummaryStat {
  label: string
  value: string
  sub: string
  positive: boolean
  accent: string
  bg: string
}

interface AttendanceChartPoint {
  month: string
  present: number
}

interface PaymentChartPoint {
  name: string
  value: number
  color: string
}

interface GradeChartPoint {
  grade: string
  count: number
}

interface InsightItem {
  icon: string
  color: string
  bg: string
  text: string
}

function getCopy(locale: 'ar' | 'en') {
  return locale === 'ar'
    ? {
        loadError: 'فشل تحميل التقارير. يرجى التحديث.',
        aiWeeklyReport: 'التقرير الأسبوعي الذكي',
        previewBeforeExport: 'معاينة قبل التصدير',
        close: 'إغلاق',
        exportPdf: 'تصدير PDF',
        thisWeek: 'هذا الأسبوع',
        thisMonth: 'هذا الشهر',
        thisSemester: 'هذا الفصل',
        noReportData: 'لا توجد بيانات تقرير بعد.',
        weeklyReportFor: 'تقرير أسبوعي لـ',
        paymentHighlights: 'أبرز المدفوعات',
        previewReport: 'معاينة التقرير',
        reportSubtitle: 'عاين التقرير قبل تصديره بصيغة PDF.',
        totalStudents: 'إجمالي الطلاب',
        totalTeachers: 'إجمالي المعلمين',
        paymentRate: 'نسبة التحصيل',
        activeRate: 'نسبة النشاط',
        active: 'نشط',
        classes: 'صفوف',
        paidSuffix: 'مدفوع',
        weeklyAttendance: 'الحضور الأسبوعي',
        attendanceSubtitle: 'عدد الطلاب الحاضرين يوميًا',
        noAttendanceData: 'لا توجد بيانات حضور',
        noAttendanceDataMessage: 'سيظهر الحضور هنا بعد تسجيله.',
        paymentStatus: 'حالة المدفوعات',
        paymentStatusSubtitle: 'التقسيم حسب الحالة',
        noPaymentData: 'لا توجد بيانات مدفوعات',
        noPaymentDataMessage: 'ستظهر المدفوعات هنا بعد إضافتها.',
        paid: 'مدفوع',
        pending: 'معلق',
        overdue: 'متأخر',
        gradeDistribution: 'توزيع الدرجات',
        gradeDistributionSubtitle: 'عدد الطلاب في كل نطاق',
        noGradeData: 'لا توجد بيانات درجات',
        noGradeDataMessage: 'ستظهر الدرجات هنا بعد إضافتها.',
        students: 'طلاب',
        keyInsights: 'أهم الرؤى',
        keyInsightsSubtitle: 'بناءً على بيانات حقيقية',
        attendanceStrong: 'الحضور قوي اليوم بنسبة',
        attendanceBelow: 'الحضور اليوم',
        belowTarget: 'أقل من هدف 90%',
        noAttendanceYet: 'لم يتم تسجيل حضور اليوم بعد',
        overdueNeedFollowUp: 'دفعات متأخرة تحتاج متابعة فورية',
        pendingStillOpen: 'دفعات ما زالت معلقة',
        topGrades: 'طلاب حققوا أعلى الدرجات',
        addMoreData: 'أضف المزيد من البيانات لعرض الرؤى هنا',
        errorLoadingReports: 'خطأ في تحميل التقارير',
        retry: 'إعادة المحاولة',
        yesIcon: '✓',
        warnIcon: '!',
        starIcon: '★',
        arrowIcon: '↑',
      }
    : {
        loadError: 'Failed to load reports. Please refresh.',
        aiWeeklyReport: 'AI Weekly Report',
        previewBeforeExport: 'Preview before export',
        close: 'Close',
        exportPdf: 'Export PDF',
        thisWeek: 'This week',
        thisMonth: 'This month',
        thisSemester: 'This semester',
        noReportData: 'No report data available yet.',
        weeklyReportFor: 'Weekly report for',
        paymentHighlights: 'Payment highlights',
        previewReport: 'Preview Report',
        reportSubtitle: 'Preview the generated report before exporting it as PDF.',
        totalStudents: 'Total Students',
        totalTeachers: 'Total Teachers',
        paymentRate: 'Payment Rate',
        activeRate: 'Active Rate',
        active: 'active',
        classes: 'classes',
        paidSuffix: 'paid',
        weeklyAttendance: 'Weekly Attendance',
        attendanceSubtitle: 'Students present per day',
        noAttendanceData: 'No attendance data',
        noAttendanceDataMessage: 'Attendance will appear here once recorded.',
        paymentStatus: 'Payment Status',
        paymentStatusSubtitle: 'Breakdown by status',
        noPaymentData: 'No payment data',
        noPaymentDataMessage: 'Payments will appear here once added.',
        paid: 'Paid',
        pending: 'Pending',
        overdue: 'Overdue',
        gradeDistribution: 'Grade Distribution',
        gradeDistributionSubtitle: 'Students per grade range',
        noGradeData: 'No grade data',
        noGradeDataMessage: 'Grade data will appear here once students have grades.',
        students: 'Students',
        keyInsights: 'Key Insights',
        keyInsightsSubtitle: 'Based on real data',
        attendanceStrong: 'Attendance is strong at',
        attendanceBelow: 'Attendance is',
        belowTarget: 'below 90% target',
        noAttendanceYet: 'No attendance recorded today yet',
        overdueNeedFollowUp: 'overdue payments need immediate follow-up',
        pendingStillOpen: 'payments are still pending',
        topGrades: 'students achieved top grades',
        addMoreData: 'Add more data to see insights here',
        errorLoadingReports: 'Error loading reports',
        retry: 'Retry',
        yesIcon: '✓',
        warnIcon: '!',
        starIcon: '★',
        arrowIcon: '↑',
      }
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--surface-2,#1C1F27)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 14px', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
        {payload.map((item, i: number) => (
          <p key={i} style={{ color: item.color || item.fill, fontWeight: 700, fontSize: 14 }}>{item.name}: {item.value}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function Reports() {
  const { locale } = useLocale()
  const copy = useMemo(() => getCopy(locale), [locale])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summaryStats, setSummaryStats] = useState<SummaryStat[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceChartPoint[]>([])
  const [paymentData, setPaymentData] = useState<PaymentChartPoint[]>([])
  const [gradeData, setGradeData] = useState<GradeChartPoint[]>([])
  const [insights, setInsights] = useState<InsightItem[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [reportRange, setReportRange] = useState(copy.thisWeek)

  useEffect(() => {
    setReportRange(copy.thisWeek)
  }, [copy.thisWeek])

  const reportPreview = useMemo(() => {
    return [
      `${copy.weeklyReportFor} ${reportRange}`,
      summaryStats[0] ? `${summaryStats[0].label}: ${summaryStats[0].value}` : '',
      insights[0]?.text || '',
      insights[1]?.text || '',
      paymentData.length > 0 ? `${copy.paymentHighlights}: ${paymentData.map(item => `${item.name} ${item.value}`).join(', ')}` : '',
    ].filter(Boolean).join('\n\n')
  }, [reportRange, summaryStats, insights, paymentData, copy.weeklyReportFor, copy.paymentHighlights])

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [studentsRes, teachersRes, paymentsRes, attendanceRes, weekRes] = await Promise.all([
        api.get('/students'),
        api.get('/teachers'),
        api.get('/payments'),
        api.get('/attendance/summary'),
        api.get('/attendance/weekly'),
      ])
      const students: StudentRecord[] = studentsRes.data.students
      const teachers: TeacherRecord[] = teachersRes.data.teachers
      const payments: PaymentRecord[] = paymentsRes.data.payments
      const attendanceSummary = attendanceRes.data.summary
      const weekly: WeeklyAttendancePoint[] = weekRes.data.weekly ?? []

      const activeCount = students.filter(s => s.status === 'Active').length
      const paidCount = payments.filter(p => p.status === 'paid').length
      const payRate = payments.length ? Math.round((paidCount / payments.length) * 100) : 0
      const activeRate = students.length ? Math.round((activeCount / students.length) * 100) : 0
      const attendanceRate = attendanceSummary.totalStudents
        ? Math.round((attendanceSummary.present / attendanceSummary.totalStudents) * 100) : 0

      setSummaryStats([
        { label: copy.totalStudents, value: String(students.length), sub: `${activeCount} ${copy.active}`, positive: true, accent: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
        { label: copy.totalTeachers, value: String(teachers.length), sub: `${teachers.reduce((sum, teacher) => sum + teacher.classes, 0)} ${copy.classes}`, positive: true, accent: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
        { label: copy.paymentRate, value: `${payRate}%`, sub: `${paidCount}/${payments.length} ${copy.paidSuffix}`, positive: payRate >= 70, accent: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        { label: copy.activeRate, value: `${activeRate}%`, sub: `${activeCount} / ${students.length}`, positive: activeRate >= 80, accent: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
      ])

      setAttendanceData(weekly.map((item) => ({ month: item.day, present: item.students })))

      const pending = payments.filter(p => p.status === 'pending').length
      const overdue = payments.filter(p => p.status === 'overdue').length
      setPaymentData([
        { name: copy.paid, value: paidCount, color: '#10b981' },
        { name: copy.pending, value: pending, color: '#fbbf24' },
        { name: copy.overdue, value: overdue, color: '#f87171' },
      ].filter(i => i.value > 0))

      const gradeBuckets: Record<string, number> = { 'A+/A': 0, 'A-/B+': 0, 'B/B-': 0, 'C & below': 0 }
      students.forEach(s => {
        const g = s.grade || ''
        if (['A+', 'A'].includes(g)) gradeBuckets['A+/A']++
        else if (['A-', 'B+'].includes(g)) gradeBuckets['A-/B+']++
        else if (['B', 'B-'].includes(g)) gradeBuckets['B/B-']++
        else if (g) gradeBuckets['C & below']++
      })
      setGradeData(Object.entries(gradeBuckets).filter(([, c]) => c > 0).map(([g, c]) => ({ grade: g, count: c })))

      const next: InsightItem[] = []
      if (attendanceRate >= 90) next.push({ icon: copy.yesIcon, color: '#10b981', bg: 'rgba(16,185,129,0.1)', text: `${copy.attendanceStrong} ${attendanceRate}%` })
      else next.push({ icon: copy.warnIcon, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', text: attendanceRate > 0 ? `${copy.attendanceBelow} ${attendanceRate}% - ${copy.belowTarget}` : copy.noAttendanceYet })
      if (overdue > 0) next.push({ icon: copy.warnIcon, color: '#f87171', bg: 'rgba(248,113,113,0.1)', text: `${overdue} ${copy.overdueNeedFollowUp}` })
      if (pending > 0) next.push({ icon: copy.warnIcon, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', text: `${pending} ${copy.pendingStillOpen}` })
      const topStudents = students.filter(s => s.grade && ['A+', 'A'].includes(s.grade)).length
      if (topStudents > 0) next.push({ icon: copy.starIcon, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', text: `${topStudents} ${copy.topGrades}` })
      if (next.length === 0) next.push({ icon: copy.arrowIcon, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', text: copy.addMoreData })
      setInsights(next)
    } catch {
      setError(copy.loadError)
    } finally {
      setLoading(false)
    }
  }, [copy])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const rangeOptions = [copy.thisWeek, copy.thisMonth, copy.thisSemester]

  return (
    <div className="space-y-5 animate-fade-in">
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={copy.aiWeeklyReport}
        subtitle={copy.previewBeforeExport}
        maxWidth={760}
        footer={
          <div className="flex gap-2.5">
            <button onClick={() => setPreviewOpen(false)} className="btn-ghost flex-1 py-2.5 text-[13px] rounded-xl">{copy.close}</button>
            <button onClick={() => window.print()} className="btn-primary flex-1 py-2.5 text-[13px] rounded-xl">{copy.exportPdf}</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <select className="input" style={{ maxWidth: 180 }} value={reportRange} onChange={e => setReportRange(e.target.value)}>
              {rangeOptions.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="rounded-2xl p-5 whitespace-pre-wrap text-[13px] leading-7" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            {reportPreview || copy.noReportData}
          </div>
        </div>
      </Modal>

      <section className="card p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{copy.aiWeeklyReport}</h2>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{copy.reportSubtitle}</p>
        </div>
        <button onClick={() => setPreviewOpen(true)} className="btn-primary px-4 py-2.5 text-[13px]" style={{ borderRadius: 12 }}>
          {copy.previewReport}
        </button>
      </section>

      <div className="grid grid-cols-4 gap-3 stagger">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : summaryStats.map(s => (
            <div key={s.label} className="card card-glow p-5 animate-slide-up group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: s.bg, color: s.accent }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 20V10M18 20V4M6 20v-6" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{s.label}</span>
              </div>
              <p className="text-[28px] font-extrabold leading-none tracking-tight" style={{ color: 'var(--text)' }}>{s.value}</p>
              <p className="text-[11px] mt-1.5 font-semibold" style={{ color: s.positive ? '#10b981' : '#f87171' }}>{s.sub}</p>
            </div>
          ))
        }
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 card p-5 animate-slide-up">
          <div className="mb-5">
            <h2 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.weeklyAttendance}</h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{copy.attendanceSubtitle}</p>
          </div>
          {loading ? (
            <div className="skeleton rounded-xl" style={{ height: 220 }} />
          ) : attendanceData.length === 0 ? (
            <EmptyState title={copy.noAttendanceData} message={copy.noAttendanceDataMessage} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceData} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="present" name={copy.paid} radius={[6, 6, 0, 0]}>
                  {attendanceData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${265 - i * 8}, 70%, ${55 + i * 3}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5 animate-slide-up" style={{ animationDelay: '60ms' }}>
          <div className="mb-5">
            <h2 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.paymentStatus}</h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{copy.paymentStatusSubtitle}</p>
          </div>
          {loading ? (
            <div className="skeleton rounded-xl" style={{ height: 160 }} />
          ) : paymentData.length === 0 ? (
            <EmptyState title={copy.noPaymentData} message={copy.noPaymentDataMessage} />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} dataKey="value" paddingAngle={4}>
                    {paymentData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--surface-2,#1C1F27)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} itemStyle={{ color: 'var(--text)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 mt-2">
                {paymentData.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{item.name}</span>
                    </div>
                    <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="mb-5">
            <h2 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.gradeDistribution}</h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{copy.gradeDistributionSubtitle}</p>
          </div>
          {loading ? (
            <div className="skeleton rounded-xl" style={{ height: 160 }} />
          ) : gradeData.length === 0 ? (
            <EmptyState title={copy.noGradeData} message={copy.noGradeDataMessage} />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={gradeData} barSize={32} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="grade" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="count" fill="url(#gradeGrad)" radius={[0, 6, 6, 0]} name={copy.students} />
                <defs>
                  <linearGradient id="gradeGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5 animate-slide-up" style={{ animationDelay: '140ms' }}>
          <div className="mb-5">
            <h2 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.keyInsights}</h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{copy.keyInsightsSubtitle}</p>
          </div>
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-3 stagger">
              {insights.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl animate-slide-up" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: item.bg, color: item.color }}>
                    {item.icon}
                  </span>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text)' }}>{item.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="card p-6">
          <EmptyState title={copy.errorLoadingReports} message={error} action={{ label: copy.retry, onClick: fetchAll }} />
        </div>
      )}
    </div>
  )
}
