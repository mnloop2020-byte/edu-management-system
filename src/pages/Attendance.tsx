import { useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../hooks/useLocale'
import { toast } from '../components/ui/Toast'
import { Modal } from '../components/ui/Modal'

interface Student { id: number; name: string; course: string }
interface AttendanceRecord { studentId: number; status: string }
interface StudentRiskStats {
  studentId: number
  studentName: string
  totalClasses: number
  presentCount: number
  absentCount: number
  lateCount: number
  attendancePercentage: number
  absencePercentage: number
  indicator: 'SAFE' | 'WARNING' | 'RISK'
  indicatorLabel: string
}
interface RiskItem extends StudentRiskStats {
  student: Student
}
type Status = 'present' | 'absent' | 'late'

function getInitials(name: string) {
  return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
}

function getIndicatorStyle(indicator: 'SAFE' | 'WARNING' | 'RISK', copy: ReturnType<typeof getCopy>) {
  if (indicator === 'RISK') return { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.26)', label: copy.exceeded }
  if (indicator === 'WARNING') return { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.26)', label: copy.nearLimit }
  return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.26)', label: copy.good }
}

function getCopy(locale: 'ar' | 'en') {
  return locale === 'ar'
    ? {
        statsTitle: 'إحصاءات الحضور',
        close: 'إغلاق',
        attendance: 'الحضور',
        absence: 'الغياب',
        absences: 'مرات الغياب',
        late: 'التأخر',
        indicator: 'المؤشر',
        desk: 'مركز الحضور',
        title: 'سجّل الحضور بعدد نقرات أقل.',
        subtitle: 'اعرض الطلاب المعرضين للخطر، وحدّث الحالات بسرعة، وتابع صحة الصف أثناء العمل.',
        markAll: 'تحديد الكل حاضر',
        saving: 'جارٍ الحفظ...',
        attendanceRate: 'نسبة الحضور',
        present: 'حاضر',
        classProgress: 'تقدم الصف',
        students: 'طلاب',
        safe: 'آمن',
        warning: 'تحذير',
        risk: 'خطر',
        riskStudents: 'الطلاب المعرضون للخطر',
        flagged: 'طلاب مميزون',
        noRisk: 'لا يوجد طلاب قريبون من حد الغياب.',
        dailyMarking: 'تسجيل اليوم',
        today: 'اليوم',
        semester: 'الفصل',
        mark: 'تحديد',
        student: 'الطالب',
        course: 'المسار',
        good: 'جيد',
        nearLimit: 'قريب من الحد',
        exceeded: 'تجاوز الحد',
        loadAttendanceStats: 'فشل تحميل إحصاءات الحضور',
        saveAttendance: 'فشل حفظ الحضور',
        markAllSuccess: 'تم تحديد جميع الطلاب كحاضرين',
        markAllError: 'فشل تحديد الجميع كحاضرين',
        statusPresent: 'حاضر',
        statusAbsent: 'غائب',
        statusLate: 'متأخر',
        absencesCount: 'غيابات',
      }
    : {
        statsTitle: 'Attendance Stats',
        close: 'Close',
        attendance: 'Attendance',
        absence: 'Absence',
        absences: 'Absences',
        late: 'Late',
        indicator: 'Indicator',
        desk: 'Attendance Desk',
        title: 'Take attendance with fewer clicks.',
        subtitle: 'Surface risky students, mark statuses quickly, and keep class health visible while you work.',
        markAll: 'Mark all present',
        saving: 'Saving...',
        attendanceRate: 'Attendance Rate',
        present: 'Present',
        classProgress: 'Class Progress',
        students: 'students',
        safe: 'Safe',
        warning: 'Warning',
        risk: 'Risk',
        riskStudents: 'Risk Students',
        flagged: 'flagged',
        noRisk: 'No students are near the absence limit.',
        dailyMarking: 'Daily Marking',
        today: 'Today',
        semester: 'Semester',
        mark: 'Mark',
        student: 'Student',
        course: 'Course',
        good: 'Good',
        nearLimit: 'Near limit',
        exceeded: 'Exceeded',
        loadAttendanceStats: 'Failed to load attendance stats',
        saveAttendance: 'Failed to save attendance',
        markAllSuccess: 'All students marked present',
        markAllError: 'Failed to mark all present',
        statusPresent: 'Present',
        statusAbsent: 'Absent',
        statusLate: 'Late',
        absencesCount: 'absences',
      }
}

export default function Attendance() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const copy = getCopy(locale)
  const isAdmin = user?.role === 'ADMIN'
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<number, Status>>({})
  const [riskItems, setRiskItems] = useState<RiskItem[]>([])
  const [selectedStats, setSelectedStats] = useState<StudentRiskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | 'all' | null>(null)

  const statusConfig: Record<Status, { label: string; color: string; bg: string; border: string }> = {
    present: { label: copy.statusPresent, color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)' },
    absent: { label: copy.statusAbsent, color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.28)' },
    late: { label: copy.statusLate, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.28)' },
  }

  useEffect(() => { void fetchData() }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [studentsRes, attendanceRes, riskRes] = await Promise.all([api.get('/students'), api.get('/attendance'), api.get('/attendance/risk')])
      const studentList: Student[] = studentsRes.data.students
      const records: AttendanceRecord[] = attendanceRes.data.records
      const nextAttendance: Record<number, Status> = {}
      studentList.forEach(student => { nextAttendance[student.id] = 'present' })
      records.forEach(record => { nextAttendance[record.studentId] = record.status as Status })
      setStudents(studentList)
      setAttendance(nextAttendance)
      setRiskItems(riskRes.data.items ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function handleMark(studentId: number, status: Status) {
    if (!isAdmin) return
    const previous = attendance[studentId] || 'present'
    setAttendance(current => ({ ...current, [studentId]: status }))
    setSaving(studentId)
    try {
      await api.post('/attendance', { studentId, status })
    } catch {
      setAttendance(current => ({ ...current, [studentId]: previous }))
      toast.error(copy.saveAttendance)
    } finally {
      setSaving(null)
    }
  }

  async function markAllPresent() {
    if (!isAdmin || students.length === 0) return
    setSaving('all')
    const previous = attendance
    const presentMap = Object.fromEntries(students.map(student => [student.id, 'present'])) as Record<number, Status>
    setAttendance(presentMap)
    try {
      await Promise.all(students.map(student => api.post('/attendance', { studentId: student.id, status: 'present' })))
      toast.success(copy.markAllSuccess)
    } catch {
      setAttendance(previous)
      toast.error(copy.markAllError)
    } finally {
      setSaving(null)
    }
  }

  async function openStudentStats(student: Student) {
    try {
      const res = await api.get(`/attendance/student/${student.id}/stats`)
      setSelectedStats(res.data)
    } catch {
      toast.error(copy.loadAttendanceStats)
    }
  }

  const counts = useMemo(() => ({
    present: Object.values(attendance).filter(item => item === 'present').length,
    absent: Object.values(attendance).filter(item => item === 'absent').length,
    late: Object.values(attendance).filter(item => item === 'late').length,
  }), [attendance])

  const attendanceRate = students.length ? Math.round((counts.present / students.length) * 100) : 0
  const riskMap = new Map(riskItems.map(item => [item.student.id, item]))
  const riskSummary = {
    safe: Math.max(0, students.length - riskItems.length),
    warning: riskItems.filter(item => item.indicator === 'WARNING').length,
    risk: riskItems.filter(item => item.indicator === 'RISK').length,
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Modal
        open={!!selectedStats}
        onClose={() => setSelectedStats(null)}
        title={selectedStats?.studentName || copy.statsTitle}
        maxWidth={520}
        footer={<button onClick={() => setSelectedStats(null)} className="btn-ghost w-full py-2.5 text-[13px] rounded-xl">{copy.close}</button>}
      >
        {selectedStats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: copy.attendance, value: `${selectedStats.attendancePercentage}%`, color: '#10b981' },
                { label: copy.absence, value: `${selectedStats.absencePercentage}%`, color: '#f87171' },
                { label: copy.absences, value: selectedStats.absentCount, color: selectedStats.absentCount > 4 ? '#f87171' : '#fbbf24' },
                { label: copy.late, value: selectedStats.lateCount, color: '#fbbf24' },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                  <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{item.label}</p>
                  <p className="text-[18px] font-bold mt-1" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
              <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{copy.indicator}</p>
              <p className="text-[15px] font-bold mt-1" style={{ color: getIndicatorStyle(selectedStats.indicator, copy).color }}>{selectedStats.indicatorLabel}</p>
            </div>
          </div>
        )}
      </Modal>

      <section className="card p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(circle at top right, rgba(124,58,237,0.18), transparent 40%)' }} />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-faint)' }}>{copy.desk}</p>
            <h2 className="text-[26px] font-extrabold mt-2" style={{ color: 'var(--text)' }}>{copy.title}</h2>
            <p className="text-[13px] mt-3 max-w-[680px]" style={{ color: 'var(--text-muted)' }}>{copy.subtitle}</p>
          </div>
          {isAdmin && <button onClick={markAllPresent} disabled={saving === 'all'} className="btn-primary px-4 py-2.5 text-[13px]" style={{ borderRadius: 12 }}>{saving === 'all' ? copy.saving : copy.markAll}</button>}
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: copy.attendanceRate, value: `${attendanceRate}%`, color: attendanceRate >= 85 ? '#10b981' : '#fbbf24' },
          { label: copy.present, value: counts.present, color: '#10b981' },
          { label: copy.late, value: counts.late, color: '#fbbf24' },
          { label: copy.absence, value: counts.absent, color: '#f87171' },
        ].map(item => (
          <div key={item.label} className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{item.label}</p>
            <p className="text-[26px] font-extrabold mt-2" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.classProgress}</h3>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{students.length} {copy.students}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden flex gap-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ width: `${students.length ? (counts.present / students.length) * 100 : 0}%`, background: '#10b981' }} />
            <div style={{ width: `${students.length ? (counts.late / students.length) * 100 : 0}%`, background: '#fbbf24' }} />
            <div style={{ width: `${students.length ? (counts.absent / students.length) * 100 : 0}%`, background: '#f87171' }} />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: copy.safe, value: riskSummary.safe, color: '#10b981' },
              { label: copy.warning, value: riskSummary.warning, color: '#fbbf24' },
              { label: copy.risk, value: riskSummary.risk, color: '#f87171' },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{item.label}</p>
                <p className="text-[20px] font-bold mt-1" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.riskStudents}</h3>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{riskItems.length} {copy.flagged}</span>
          </div>
          <div className="space-y-2.5">
            {riskItems.length === 0 ? (
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{copy.noRisk}</p>
            ) : riskItems.slice(0, 5).map(item => {
              const tone = getIndicatorStyle(item.indicator, copy)
              return (
                <button key={item.student.id} onClick={() => openStudentStats(item.student)} className="w-full rounded-xl p-3 text-left transition-all hover:translate-y-[-1px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>{item.student.name}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{item.absentCount} {copy.absencesCount}</p>
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color: tone.color }}>{tone.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.dailyMarking}</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[copy.student, copy.course, copy.today, copy.semester, isAdmin ? copy.mark : ''].filter(Boolean).map(header => (
                <th key={header} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 6 }).map((_, index) => (
              <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                {[160, 90, 70, 100, 210].map((width, cell) => <td key={cell} className="px-5 py-4"><div className="skeleton" style={{ width, height: 14 }} /></td>)}
              </tr>
            )) : students.map((student, index) => {
              const current = attendance[student.id] || 'present'
              const currentStyle = statusConfig[current]
              const tone = getIndicatorStyle(riskMap.get(student.id)?.indicator || 'SAFE', copy)
              return (
                <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: `linear-gradient(135deg, ${['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'][index % 5]}, #4f46e5)` }}>
                        {getInitials(student.name)}
                      </div>
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{student.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[13px]" style={{ color: 'var(--text-muted)' }}>{student.course}</td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ color: currentStyle.color, background: currentStyle.bg, border: `1px solid ${currentStyle.border}` }}>{currentStyle.label}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => openStudentStats(student)} className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ color: tone.color, background: tone.bg, border: `1px solid ${tone.border}` }}>{tone.label}</button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      {(['present', 'late', 'absent'] as Status[]).map(status => {
                        const item = statusConfig[status]
                        const active = current === status
                        return (
                          <button
                            key={status}
                            onClick={() => handleMark(student.id, status)}
                            disabled={!isAdmin || saving === student.id}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                            style={{
                              background: active ? item.bg : 'transparent',
                              color: active ? item.color : 'var(--text-faint)',
                              border: `1px solid ${active ? item.border : 'var(--border)'}`,
                              opacity: !isAdmin ? 0.6 : 1,
                            }}
                          >
                            {item.label}
                          </button>
                        )
                      })}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}
