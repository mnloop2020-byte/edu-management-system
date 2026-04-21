import { useCallback, useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useNavigate } from 'react-router-dom'
import api from '../api/api'
import { useLocale } from '../hooks/useLocale'
import { SkeletonCard, SkeletonTable } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

interface Stats {
  students: number
  teachers: number
  attendanceRate: number
  pendingPayments: number
}

interface WeeklyPoint {
  day: string
  students: number
}

interface TrendPoint {
  month: string
  value: number
}

interface RecentStudent {
  id: number
  name: string
  course: string | null
  grade: string | null
  status: string
}

interface RiskStudent {
  id: number
  name: string
  course: string
  absentCount: number
  attendanceRate: number
  indicator: 'SAFE' | 'WARNING' | 'RISK'
}

interface ChartSlice {
  label?: string
  grade?: string
  count?: number
  value?: number
}

interface DashboardResponse {
  stats: Stats
  weekly: WeeklyPoint[]
  trend: TrendPoint[]
  recentStudents: RecentStudent[]
  riskStudents: RiskStudent[]
  paymentStatus: { paid: number; partial: number; pending: number; overdue: number }
  gradeDistribution: Array<{ grade: string; count: number }>
  insights: string[]
  activityFeed: Array<{ type: string; title: string; description: string; path: string; createdAt: string }>
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number | string; name?: string; payload?: ChartSlice }>
  label?: string
}

const paymentColors = ['#10b981', '#60a5fa', '#fbbf24', '#f87171']
const gradeColors = ['#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#94a3b8']

function getCopy(locale: 'ar' | 'en') {
  return locale === 'ar'
    ? {
        loadError: 'فشل تحميل بيانات لوحة التحكم',
        retry: 'إعادة المحاولة',
        controlCenter: 'مركز التحكم',
        heroTitle: 'أدر يومك الدراسي بوضوح.',
        heroSubtitle: 'تابع الحضور والتنبيهات والمدفوعات من مكان واحد مع الحفاظ على تجربة SaaS سريعة وواضحة.',
        addStudent: 'إضافة طالب',
        takeAttendance: 'تسجيل الحضور',
        createAssignment: 'إنشاء واجب',
        aiInsights: 'الرؤى الذكية',
        attentionToday: 'ما يحتاج إلى متابعة اليوم',
        alerts: 'تنبيهات',
        openRelated: 'افتح القسم المرتبط',
        students: 'الطلاب',
        enrolled: 'طلاب مسجلون',
        teachers: 'المعلمون',
        faculty: 'الهيئة التعليمية',
        attendance: 'الحضور',
        healthyToday: 'الوضع جيد اليوم',
        needsAttention: 'يحتاج متابعة',
        pendingPayments: 'المدفوعات المعلقة',
        paymentItems: 'عناصر تحصيل مفتوحة',
        weeklyAttendance: 'الحضور الأسبوعي',
        weekPresence: 'حضور الطلاب خلال الأسبوع',
        thisWeek: 'هذا الأسبوع',
        noAttendanceData: 'لا توجد بيانات حضور',
        noAttendanceDataMessage: 'ستظهر الرسوم هنا بعد تسجيل الحضور اليومي.',
        quickActions: 'إجراءات سريعة',
        shortcuts: 'اختصارات للعمليات اليومية',
        openNow: 'افتح الآن',
        paymentStatus: 'حالة المدفوعات',
        distribution: 'التوزيع الحالي للتحصيل',
        noPaymentData: 'لا توجد بيانات مدفوعات',
        noPaymentDataMessage: 'ستظهر حالة المدفوعات بعد توفر السجلات.',
        gradeDistribution: 'توزيع الدرجات',
        gradeSpread: 'كيف تتوزع الدرجات الآن',
        noGradeData: 'لا توجد بيانات درجات',
        noGradeDataMessage: 'سيظهر توزيع الدرجات بعد تحديث سجلات الطلاب.',
        enrollmentTrend: 'اتجاه التسجيل',
        lastSixMonths: 'آخر 6 أشهر',
        riskStudents: 'الطلاب المعرضون للخطر',
        absenceAlerts: 'تنبيهات حد الغياب',
        openStudents: 'افتح الطلاب',
        noRiskStudents: 'لا يوجد طلاب معرضون للخطر',
        noRiskStudentsMessage: 'الجميع ضمن حد الغياب الحالي.',
        absences: 'غيابات',
        attendanceSuffix: 'حضور',
        recentStudents: 'أحدث الطلاب',
        latestEnrollment: 'آخر نشاط تسجيل',
        viewAll: 'عرض الكل',
        student: 'الطالب',
        course: 'المسار',
        grade: 'التقدير',
        status: 'الحالة',
        noStudentsYet: 'لا يوجد طلاب بعد',
        noStudentsYetMessage: 'سيظهر الطلاب هنا بعد التسجيل.',
        activityFeed: 'سجل النشاط',
        activitySubtitle: 'آخر الإجراءات عبر الطلاب والحضور والمدفوعات والواجبات',
        openReports: 'افتح التقارير',
        noRecentActivity: 'لا يوجد نشاط حديث',
        noRecentActivityMessage: 'سيظهر النشاط هنا مع استخدام المنصة.',
        paid: 'مدفوع',
        partial: 'جزئي',
        pending: 'معلق',
        overdue: 'متأخر',
        safe: 'آمن',
        warning: 'تحذير',
        risk: 'خطر',
      }
    : {
        loadError: 'Failed to load dashboard data',
        retry: 'Retry',
        controlCenter: 'Control Center',
        heroTitle: 'Run the school day with clarity.',
        heroSubtitle: 'Focus on attendance, risk alerts, and payments from one place without losing the dark SaaS feel of the current product.',
        addStudent: 'Add Student',
        takeAttendance: 'Take Attendance',
        createAssignment: 'Create Assignment',
        aiInsights: 'AI Insights',
        attentionToday: 'What needs attention today',
        alerts: 'alerts',
        openRelated: 'Open related section',
        students: 'Students',
        enrolled: 'Enrolled learners',
        teachers: 'Teachers',
        faculty: 'Active faculty',
        attendance: 'Attendance',
        healthyToday: 'Healthy today',
        needsAttention: 'Needs attention',
        pendingPayments: 'Pending Payments',
        paymentItems: 'Open payment items',
        weeklyAttendance: 'Weekly Attendance',
        weekPresence: 'Student presence across the week',
        thisWeek: 'This week',
        noAttendanceData: 'No attendance data',
        noAttendanceDataMessage: 'Attendance charts will appear here after daily marking.',
        quickActions: 'Quick Actions',
        shortcuts: 'Shortcuts for daily operations',
        openNow: 'Open now',
        paymentStatus: 'Payment Status',
        distribution: 'Current collection distribution',
        noPaymentData: 'No payment data',
        noPaymentDataMessage: 'Payment status will appear once records are available.',
        gradeDistribution: 'Grade Distribution',
        gradeSpread: 'How grades are spread right now',
        noGradeData: 'No grade data',
        noGradeDataMessage: 'Grade distribution appears after student records are updated.',
        enrollmentTrend: 'Enrollment Trend',
        lastSixMonths: 'Last 6 months',
        riskStudents: 'Risk Students',
        absenceAlerts: 'Absence threshold alerts',
        openStudents: 'Open students',
        noRiskStudents: 'No risky students',
        noRiskStudentsMessage: 'Everyone is within the current absence threshold.',
        absences: 'Absences',
        attendanceSuffix: 'attendance',
        recentStudents: 'Recent Students',
        latestEnrollment: 'Latest enrollment activity',
        viewAll: 'View all',
        student: 'Student',
        course: 'Course',
        grade: 'Grade',
        status: 'Status',
        noStudentsYet: 'No students yet',
        noStudentsYetMessage: 'Students will appear here after enrollment.',
        activityFeed: 'Activity Feed',
        activitySubtitle: 'Latest system actions across students, attendance, payments, and assignments',
        openReports: 'Open reports',
        noRecentActivity: 'No recent activity',
        noRecentActivityMessage: 'System actions will appear here as the team uses the platform.',
        paid: 'Paid',
        partial: 'Partial',
        pending: 'Pending',
        overdue: 'Overdue',
        safe: 'Safe',
        warning: 'Warning',
        risk: 'Risk',
      }
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-[12px]" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
      <p style={{ color: 'var(--text-muted)' }}>{label || payload[0].name || payload[0].payload?.grade}</p>
      <p className="font-bold mt-1" style={{ color: 'var(--text)' }}>{payload[0].value}</p>
    </div>
  )
}

function getRiskTone(indicator: RiskStudent['indicator'], copy: ReturnType<typeof getCopy>) {
  if (indicator === 'RISK') return { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: copy.risk }
  if (indicator === 'WARNING') return { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: copy.warning }
  return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: copy.safe }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { locale } = useLocale()
  const copy = useMemo(() => getCopy(locale), [locale])
  const [data, setData] = useState<DashboardResponse>({
    stats: { students: 0, teachers: 0, attendanceRate: 0, pendingPayments: 0 },
    weekly: [],
    trend: [],
    recentStudents: [],
    riskStudents: [],
    paymentStatus: { paid: 0, partial: 0, pending: 0, overdue: 0 },
    gradeDistribution: [],
    insights: [],
    activityFeed: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await api.get('/dashboard')
      setData({
        stats: res.data.stats ?? { students: 0, teachers: 0, attendanceRate: 0, pendingPayments: 0 },
        weekly: res.data.weekly ?? [],
        trend: res.data.trend ?? [],
        recentStudents: res.data.recentStudents ?? [],
        riskStudents: res.data.riskStudents ?? [],
        paymentStatus: res.data.paymentStatus ?? { paid: 0, partial: 0, pending: 0, overdue: 0 },
        gradeDistribution: res.data.gradeDistribution ?? [],
        insights: res.data.insights ?? [],
        activityFeed: res.data.activityFeed ?? [],
      })
    } catch (err: unknown) {
      setError(isAxiosError(err) ? err.response?.data?.message || copy.loadError : copy.loadError)
    } finally {
      setLoading(false)
    }
  }, [copy.loadError])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const cards = useMemo(() => [
    { title: copy.students, value: data.stats.students, helper: copy.enrolled, color: '#a78bfa', bg: 'rgba(124,58,237,0.14)' },
    { title: copy.teachers, value: data.stats.teachers, helper: copy.faculty, color: '#60a5fa', bg: 'rgba(96,165,250,0.14)' },
    { title: copy.attendance, value: `${data.stats.attendanceRate}%`, helper: data.stats.attendanceRate >= 85 ? copy.healthyToday : copy.needsAttention, color: '#10b981', bg: 'rgba(16,185,129,0.14)' },
    { title: copy.pendingPayments, value: data.stats.pendingPayments, helper: copy.paymentItems, color: '#f87171', bg: 'rgba(248,113,113,0.14)' },
  ], [copy, data.stats])

  const actionConfig = useMemo(() => [
    { label: copy.addStudent, path: '/students', color: '#a78bfa' },
    { label: copy.takeAttendance, path: '/attendance', color: '#10b981' },
    { label: copy.createAssignment, path: '/assignments', color: '#60a5fa' },
  ], [copy])

  const paymentStatusChart = [
    { label: copy.paid, value: data.paymentStatus.paid },
    { label: copy.partial, value: data.paymentStatus.partial },
    { label: copy.pending, value: data.paymentStatus.pending },
    { label: copy.overdue, value: data.paymentStatus.overdue },
  ].filter(item => item.value > 0)

  const dateLocale = locale === 'ar' ? 'ar' : 'en-GB'

  return (
    <div className="space-y-5 animate-fade-in">
      {error && (
        <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <p className="text-[13px]" style={{ color: '#f87171', flex: 1 }}>{error}</p>
          <button onClick={fetchData} className="btn-ghost px-3 py-1.5 text-[12px]">{copy.retry}</button>
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-4">
        <div className="card p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at top right, rgba(124,58,237,0.22), transparent 40%)' }} />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-faint)' }}>{copy.controlCenter}</p>
            <h2 className="text-[28px] font-extrabold mt-2 leading-tight" style={{ color: 'var(--text)' }}>{copy.heroTitle}</h2>
            <p className="text-[13px] mt-3 max-w-[560px]" style={{ color: 'var(--text-muted)' }}>{copy.heroSubtitle}</p>
            <div className="flex flex-wrap gap-2 mt-5">
              {actionConfig.map(action => (
                <button key={action.label} onClick={() => navigate(action.path)} className="btn-ghost px-4 py-2 text-[12px]" style={{ borderRadius: 12, color: action.color }}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.aiInsights}</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.attentionToday}</p>
            </div>
            <span className="badge badge-purple">{loading ? '...' : `${data.insights.length} ${copy.alerts}`}</span>
          </div>
          <div className="space-y-2.5">
            {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 54 }} />) : data.insights.map((item, index) => (
              <button
                key={item}
                onClick={() => navigate(index === 0 ? '/attendance' : index === 2 ? '/payments' : '/reports')}
                className="w-full text-left rounded-xl p-3 transition-all hover:translate-y-[-1px]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
              >
                <p className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>{item}</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{copy.openRelated}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : cards.map(card => (
          <div key={card.title} className="card p-5 card-glow animate-slide-up">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: card.bg, color: card.color }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: card.color }} />
            </div>
            <p className="text-[28px] font-extrabold leading-none" style={{ color: 'var(--text)' }}>{card.value}</p>
            <p className="text-[12px] font-semibold mt-2" style={{ color: 'var(--text)' }}>{card.title}</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{card.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.weeklyAttendance}</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.weekPresence}</p>
            </div>
            <span className="badge badge-purple">{copy.thisWeek}</span>
          </div>
          {loading ? (
            <div className="skeleton rounded-xl" style={{ height: 250 }} />
          ) : data.weekly.length === 0 ? (
            <EmptyState title={copy.noAttendanceData} message={copy.noAttendanceDataMessage} />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.weekly} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="students" radius={[10, 10, 0, 0]} fill="url(#dashboardAttendance)" />
                <defs>
                  <linearGradient id="dashboardAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-5">
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.quickActions}</h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.shortcuts}</p>
          </div>
          <div className="space-y-3">
            {actionConfig.map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="w-full rounded-xl p-4 text-left transition-all hover:translate-y-[-1px]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
              >
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{action.label}</p>
                <p className="text-[11px] mt-1" style={{ color: action.color }}>{copy.openNow}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.paymentStatus}</h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.distribution}</p>
          </div>
          {loading ? (
            <div className="skeleton rounded-xl" style={{ height: 210 }} />
          ) : paymentStatusChart.length === 0 ? (
            <EmptyState title={copy.noPaymentData} message={copy.noPaymentDataMessage} />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={paymentStatusChart} dataKey="value" nameKey="label" innerRadius={54} outerRadius={82} paddingAngle={4}>
                    {paymentStatusChart.map((item, index) => <Cell key={item.label} fill={paymentColors[index]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {paymentStatusChart.map((item, index) => (
                  <div key={item.label} className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: paymentColors[index] }} />
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    </div>
                    <p className="text-[16px] font-bold mt-1" style={{ color: 'var(--text)' }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.gradeDistribution}</h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.gradeSpread}</p>
          </div>
          {loading ? (
            <div className="skeleton rounded-xl" style={{ height: 210 }} />
          ) : data.gradeDistribution.length === 0 ? (
            <EmptyState title={copy.noGradeData} message={copy.noGradeDataMessage} />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={data.gradeDistribution} dataKey="count" nameKey="grade" innerRadius={46} outerRadius={82}>
                    {data.gradeDistribution.map((item, index) => <Cell key={item.grade} fill={gradeColors[index % gradeColors.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {data.gradeDistribution.slice(0, 4).map((item, index) => (
                  <div key={item.grade} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: gradeColors[index % gradeColors.length] }} />
                      <span style={{ color: 'var(--text-muted)' }}>{item.grade}</span>
                    </div>
                    <span style={{ color: 'var(--text)' }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.enrollmentTrend}</h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.lastSixMonths}</p>
          </div>
          {loading ? (
            <div className="skeleton rounded-xl" style={{ height: 210 }} />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="dashboardTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Area type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2.5} fill="url(#dashboardTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.riskStudents}</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.absenceAlerts}</p>
            </div>
            <button onClick={() => navigate('/students?status=at-risk')} className="btn-ghost px-3 py-1.5 text-[12px]">{copy.openStudents}</button>
          </div>
          <div className="space-y-2.5">
            {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 62 }} />) : data.riskStudents.length === 0 ? (
              <EmptyState title={copy.noRiskStudents} message={copy.noRiskStudentsMessage} />
            ) : data.riskStudents.map(student => {
              const tone = getRiskTone(student.indicator, copy)
              return (
                <button
                  key={student.id}
                  onClick={() => navigate(`/students?status=at-risk&studentId=${student.id}`)}
                  className="w-full rounded-xl p-4 text-left transition-all hover:translate-y-[-1px]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{student.name}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{student.course}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: tone.bg, color: tone.color }}>
                      {tone.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{copy.absences} {student.absentCount}/4</p>
                    <p className="text-[12px] font-semibold" style={{ color: tone.color }}>{student.attendanceRate}% {copy.attendanceSuffix}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.recentStudents}</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.latestEnrollment}</p>
            </div>
            <button onClick={() => navigate('/students')} className="btn-ghost px-3 py-1.5 text-[12px]">{copy.viewAll}</button>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[copy.student, copy.course, copy.grade, copy.status].map(header => (
                  <th key={header} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTable rows={4} cols={4} />
              ) : data.recentStudents.length === 0 ? (
                <tr><td colSpan={4}><EmptyState title={copy.noStudentsYet} message={copy.noStudentsYetMessage} /></td></tr>
              ) : data.recentStudents.map(student => (
                <tr
                  key={student.id}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onClick={() => navigate(`/students/${student.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-6 py-3.5 text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{student.name}</td>
                  <td className="px-6 py-3.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>{student.course || '-'}</td>
                  <td className="px-6 py-3.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>{student.grade || '-'}</td>
                  <td className="px-6 py-3.5">
                    <span className={`badge ${student.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{student.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.activityFeed}</h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.activitySubtitle}</p>
          </div>
          <button onClick={() => navigate('/reports')} className="btn-ghost px-3 py-1.5 text-[12px]">{copy.openReports}</button>
        </div>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 58 }} />)}</div>
        ) : data.activityFeed.length === 0 ? (
          <EmptyState title={copy.noRecentActivity} message={copy.noRecentActivityMessage} />
        ) : (
          <div className="space-y-2.5">
            {data.activityFeed.map(item => (
              <button
                key={`${item.type}-${item.createdAt}-${item.title}`}
                onClick={() => navigate(item.path)}
                className="w-full text-left rounded-xl p-4 transition-all hover:translate-y-[-1px]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>{item.title}</p>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
                  </div>
                  <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-faint)' }}>
                    {new Date(item.createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
