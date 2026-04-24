import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../hooks/useLocale'
import { toast } from '../components/ui/Toast'
import { EmptyState } from '../components/ui/EmptyState'
import { localizeAcademicLabel } from '../utils/academicLocalization'

interface PerformanceItem {
  teacher: { id: number; name: string; subject: string }
  avgStudentScore: number
  attendanceRate: number
  successRate: number
  performanceScore: number
  rank?: number
}

function getCopy(locale: 'ar' | 'en') {
  return locale === 'ar'
    ? {
        loadError: 'فشل تحميل أداء المعلمين',
        recalculateSuccess: 'تمت إعادة الحساب',
        recalculateError: 'فشل إعادة الحساب',
        board: 'لوحة الأداء',
        title: 'اكتشف أقوى إشارات التدريس بسرعة أكبر.',
        subtitle: 'قارن درجة الأداء ونجاح الطلاب وتأثير الحضور في عرض ترتيب واحد واضح.',
        recalculate: 'إعادة الحساب',
        loading: 'جارٍ تحميل الأداء...',
        noData: 'لا توجد بيانات أداء',
        noDataMessage: 'أعد حساب اللقطات للشهر المحدد لإظهار هذه الصفحة.',
        performanceScore: 'درجة الأداء',
        grades: 'الدرجات',
        attendance: 'الحضور',
        success: 'النجاح',
        scoreDistribution: 'توزيع الدرجات',
        scoreDistributionSubtitle: 'ترتيب درجة الأداء للفترة المحددة',
        rankingList: 'قائمة الترتيب',
        rankingSubtitle: 'أداء المعلمين من الأقوى إلى الأضعف',
      }
    : {
        loadError: 'Failed to load teacher performance',
        recalculateSuccess: 'Performance recalculated',
        recalculateError: 'Failed to recalculate performance',
        board: 'Performance Board',
        title: 'Spot your top teaching signals faster.',
        subtitle: 'Compare performance score, student success, and attendance influence in one clean ranking view.',
        recalculate: 'Recalculate',
        loading: 'Loading performance...',
        noData: 'No performance data',
        noDataMessage: 'Recalculate snapshots for the selected month to populate this view.',
        performanceScore: 'Performance score',
        grades: 'Grades',
        attendance: 'Attendance',
        success: 'Success',
        scoreDistribution: 'Score Distribution',
        scoreDistributionSubtitle: 'Performance score ranking for the selected period',
        rankingList: 'Ranking List',
        rankingSubtitle: 'Teacher performance from strongest to weakest',
      }
}

export default function TeacherPerformance() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const copy = getCopy(locale)
  const isAdmin = user?.role === 'ADMIN'
  const [items, setItems] = useState<PerformanceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [year, setYear] = useState(String(new Date().getFullYear()))

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await api.get('/teachers/performance', { params: { month, year } })
        if (active) setItems(res.data.items)
      } catch {
        if (active) toast.error(copy.loadError)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [month, year, copy.loadError])

  async function recalculate() {
    try {
      await api.post('/teachers/performance/recalculate', { month: Number(month), year: Number(year) })
      const res = await api.get('/teachers/performance', { params: { month, year } })
      setItems(res.data.items)
      toast.success(copy.recalculateSuccess)
    } catch {
      toast.error(copy.recalculateError)
    }
  }

  const topThree = useMemo(() => items.slice(0, 3), [items])

  return (
    <div className="space-y-5 animate-fade-in">
      <section className="card p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(circle at top right, rgba(124,58,237,0.18), transparent 38%)' }} />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-faint)' }}>{copy.board}</p>
            <h2 className="text-[26px] font-extrabold mt-2" style={{ color: 'var(--text)' }}>{copy.title}</h2>
            <p className="text-[13px] mt-3 max-w-[680px]" style={{ color: 'var(--text-muted)' }}>{copy.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <input className="input" style={{ width: 100 }} type="number" value={month} onChange={e => setMonth(e.target.value)} />
            <input className="input" style={{ width: 120 }} type="number" value={year} onChange={e => setYear(e.target.value)} />
            {isAdmin && <button onClick={recalculate} className="btn-primary px-4 py-2.5 text-[13px]" style={{ borderRadius: 12 }}>{copy.recalculate}</button>}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="card p-8 text-[13px]" style={{ color: 'var(--text-muted)' }}>{copy.loading}</div>
      ) : items.length === 0 ? (
        <div className="card"><EmptyState title={copy.noData} message={copy.noDataMessage} /></div>
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topThree.map((item, index) => (
              <div key={item.teacher.id} className="card p-5 relative overflow-hidden">
                <div className="absolute inset-0 opacity-40" style={{ background: index === 0 ? 'radial-gradient(circle at top right, rgba(16,185,129,0.22), transparent 45%)' : 'radial-gradient(circle at top right, rgba(124,58,237,0.18), transparent 45%)' }} />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{item.teacher.name}</p>
                      <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{localizeAcademicLabel(item.teacher.subject, locale)}</p>
                    </div>
                    <span className="badge badge-purple">#{item.rank || index + 1}</span>
                  </div>
                  <p className="text-[34px] font-extrabold mt-4" style={{ color: index === 0 ? '#10b981' : '#a78bfa' }}>{item.performanceScore}</p>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>{copy.performanceScore}</p>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {[
                      { label: copy.grades, value: item.avgStudentScore, color: '#10b981' },
                      { label: copy.attendance, value: item.attendanceRate, color: '#60a5fa' },
                      { label: copy.success, value: item.successRate, color: '#fbbf24' },
                    ].map(metric => (
                      <div key={metric.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                        <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{metric.label}</p>
                        <p className="text-[14px] font-bold mt-1" style={{ color: metric.color }}>{metric.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-4">
            <div className="card p-5">
              <div className="mb-4">
                <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.scoreDistribution}</h3>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.scoreDistributionSubtitle}</p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={items}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="teacher.name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="performanceScore" fill="#a78bfa" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <div className="mb-4">
                <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.rankingList}</h3>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.rankingSubtitle}</p>
              </div>
              <div className="space-y-2.5">
                {items.map((item, index) => (
                  <div key={item.teacher.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>#{item.rank || index + 1} - {item.teacher.name}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{localizeAcademicLabel(item.teacher.subject, locale)}</p>
                      </div>
                      <span className="text-[18px] font-extrabold" style={{ color: '#a78bfa' }}>{item.performanceScore}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <Metric label={copy.grades} value={`${item.avgStudentScore}`} color="#10b981" />
                      <Metric label={copy.attendance} value={`${item.attendanceRate}%`} color="#60a5fa" />
                      <Metric label={copy.success} value={`${item.successRate}%`} color="#fbbf24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
      <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{label}</p>
      <p className="text-[13px] font-bold mt-1" style={{ color }}>{value}</p>
    </div>
  )
}
