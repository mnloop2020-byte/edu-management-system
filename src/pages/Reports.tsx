import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import api from '../api/api'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1C1F27] border border-white/[0.08] rounded-xl px-3 py-2 text-[12px] shadow-xl">
        <p className="text-white/40 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || p.fill }} className="font-semibold">{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [summaryStats, setSummaryStats] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [paymentData, setPaymentData] = useState<any[]>([])
  const [gradeData, setGradeData] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [studentsRes, teachersRes, paymentsRes, attendanceRes, weekRes] = await Promise.all([
        api.get('/students'),
        api.get('/teachers'),
        api.get('/payments'),
        api.get('/attendance/summary'),
        api.get('/attendance/weekly'),
      ])

      const students: any[] = studentsRes.data.students
      const teachers: any[] = teachersRes.data.teachers
      const payments: any[] = paymentsRes.data.payments
      const att = attendanceRes.data.summary
      const weekly: any[] = weekRes.data.weekly ?? []

      const activeCount = students.filter(s => s.status === 'Active').length
      const paidCount   = payments.filter(p => p.status === 'paid').length
      const payRate     = payments.length ? Math.round((paidCount / payments.length) * 100) : 0
      const activeRate  = students.length ? Math.round((activeCount / students.length) * 100) : 0
      const attRate     = att.totalStudents ? Math.round((att.present / att.totalStudents) * 100) : 0

      setSummaryStats([
        { label: 'Total Students',  value: String(students.length), sub: `${activeCount} active`,           positive: true },
        { label: 'Total Teachers',  value: String(teachers.length), sub: `${teachers.reduce((s: number, t: any) => s + t.classes, 0)} classes`, positive: true },
        { label: 'Payment Rate',    value: `${payRate}%`,           sub: `${paidCount}/${payments.length} paid`, positive: payRate >= 70 },
        { label: 'Active Students', value: `${activeRate}%`,        sub: `${activeCount} of ${students.length}`, positive: activeRate >= 80 },
      ])

      setAttendanceData(weekly.map((w: any) => ({
        month: w.day,
        present: w.students,
      })))

      const pending = payments.filter(p => p.status === 'pending').length
      const overdue = payments.filter(p => p.status === 'overdue').length
      setPaymentData([
        { name: 'Paid',    value: paidCount, color: '#34d399' },
        { name: 'Pending', value: pending,   color: '#fbbf24' },
        { name: 'Overdue', value: overdue,   color: '#f87171' },
      ].filter(d => d.value > 0))

      const buckets: Record<string, number> = { 'A+/A': 0, 'A−/B+': 0, 'B/B−': 0, 'C & below': 0 }
      students.forEach(s => {
        const g = s.grade || ''
        if (['A+', 'A'].includes(g))       buckets['A+/A']++
        else if (['A−', 'B+'].includes(g)) buckets['A−/B+']++
        else if (['B', 'B−'].includes(g))  buckets['B/B−']++
        else if (g)                        buckets['C & below']++
      })
      setGradeData(Object.entries(buckets).filter(([, v]) => v > 0).map(([grade, count]) => ({ grade, count })))

      const ins = []
      if (attRate >= 90)
        ins.push({ icon: '↑', color: 'text-emerald-400 bg-emerald-500/10', text: `Attendance is strong at ${attRate}% today` })
      else if (attRate > 0)
        ins.push({ icon: '!', color: 'text-amber-400 bg-amber-500/10', text: `Attendance is ${attRate}% — below the 90% target` })
      else
        ins.push({ icon: '!', color: 'text-amber-400 bg-amber-500/10', text: 'No attendance recorded today yet' })
      if (overdue > 0)
        ins.push({ icon: '!', color: 'text-red-400 bg-red-500/10', text: `${overdue} overdue payment${overdue > 1 ? 's' : ''} need immediate follow-up` })
      if (pending > 0)
        ins.push({ icon: '!', color: 'text-amber-400 bg-amber-500/10', text: `${pending} payment${pending > 1 ? 's' : ''} are still pending` })
      const topStudents = students.filter(s => s.grade && ['A+', 'A'].includes(s.grade)).length
      if (topStudents > 0)
        ins.push({ icon: '★', color: 'text-violet-400 bg-violet-500/10', text: `${topStudents} student${topStudents > 1 ? 's' : ''} achieved top grades` })
      if (ins.length === 0)
        ins.push({ icon: '↑', color: 'text-blue-400 bg-blue-500/10', text: 'Add more data to see insights here' })
      setInsights(ins)

    } catch (err) {
      console.error('Reports error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin text-violet-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        {summaryStats.map(s => (
          <div key={s.label} className="bg-[#111318] border border-white/[0.06] rounded-2xl px-5 py-4">
            <p className="text-[11px] text-white/35 mb-2">{s.label}</p>
            <p className="text-[24px] font-bold text-white leading-none">{s.value}</p>
            <p className={`text-[11px] mt-1.5 font-medium ${s.positive ? 'text-emerald-400' : 'text-red-400'}`}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
          <div className="mb-5">
            <h2 className="text-[14px] font-semibold text-white">Weekly Attendance</h2>
            <p className="text-[11px] text-white/35 mt-0.5">Students present per day</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceData} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="present" fill="#7c3aed" radius={[5, 5, 0, 0]} name="Present" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
          <div className="mb-5">
            <h2 className="text-[14px] font-semibold text-white">Payment Status</h2>
            <p className="text-[11px] text-white/35 mt-0.5">Breakdown by status</p>
          </div>
          {paymentData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {paymentData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1C1F27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }} itemStyle={{ color: 'white' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-2">
                {paymentData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-[11px] text-white/45">{d.name}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-white/60">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-[12px] text-white/25">No payment data yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
          <div className="mb-5">
            <h2 className="text-[14px] font-semibold text-white">Grade Distribution</h2>
            <p className="text-[11px] text-white/35 mt-0.5">Students per grade range</p>
          </div>
          {gradeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={gradeData} barSize={32} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="grade" type="category" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="count" fill="#6d28d9" radius={[0, 5, 5, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-[12px] text-white/25">No grade data — add grades to students first</p>
            </div>
          )}
        </div>

        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
          <div className="mb-4">
            <h2 className="text-[14px] font-semibold text-white">Key Insights</h2>
            <p className="text-[11px] text-white/35 mt-0.5">Based on real data</p>
          </div>
          <div className="flex flex-col gap-3">
            {insights.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${item.color}`}>
                  {item.icon}
                </span>
                <p className="text-[12px] text-white/50 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}