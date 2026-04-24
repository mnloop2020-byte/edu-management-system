import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../hooks/useLocale'
import { toast } from '../components/ui/Toast'
import { EmptyState } from '../components/ui/EmptyState'

type EventType = 'CLASS' | 'EXAM' | 'ASSIGNMENT_DEADLINE' | 'PAYMENT_DEADLINE'
interface MetaItem { id: number; name: string }
interface CalendarEvent {
  id: number
  title: string
  description: string | null
  type: EventType
  startAt: string
  endAt: string | null
  student: (MetaItem & { course?: string }) | null
  teacher: (MetaItem & { subject?: string }) | null
  class: (MetaItem & { code?: string }) | null
}
interface CalendarMeta {
  students: Array<MetaItem & { course: string }>
  teachers: Array<MetaItem & { subject: string }>
  classes: Array<MetaItem & { code: string }>
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const toInput = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

function asDateTimeInput(element: EventTarget & HTMLInputElement) {
  if (element.type !== 'datetime-local') {
    element.type = 'datetime-local'
  }
  if (typeof element.showPicker === 'function') {
    element.showPicker()
  }
}

function asTextInputWhenEmpty(element: EventTarget & HTMLInputElement) {
  if (!element.value) {
    element.type = 'text'
  }
}

function getCopy(locale: 'ar' | 'en') {
  return locale === 'ar'
    ? {
        labels: { CLASS: 'حصة', EXAM: 'اختبار', ASSIGNMENT_DEADLINE: 'واجب', PAYMENT_DEADLINE: 'دفعة' } as Record<EventType, string>,
        loadError: 'فشل تحميل التقويم',
        createSuccess: 'تم إنشاء الحدث',
        createError: 'فشل إنشاء الحدث',
        board: 'لوحة التقويم',
        title: 'اعرض الحصص والمواعيد النهائية وأحداث الدفع في مكان واحد.',
        subtitle: 'التقويم ملوّن حسب نوع الحدث حتى تظهر الأولويات التشغيلية بسرعة.',
        prev: 'السابق',
        today: 'اليوم',
        next: 'التالي',
        month: 'شهر',
        week: 'أسبوع',
        allTeachers: 'كل المعلمين',
        allClasses: 'كل الصفوف',
        allStudents: 'كل الطلاب',
        allTypes: 'كل أنواع الأحداث',
        eventTitle: 'عنوان الحدث',
        description: 'الوصف',
        noTeacher: 'بدون معلم',
        noClass: 'بدون صف',
        noStudent: 'بدون طالب',
        createEvent: 'إنشاء حدث',
        loading: 'جارٍ تحميل التقويم...',
        noDays: 'لا توجد أيام',
        noDaysMessage: 'جرّب نطاقًا آخر.',
        noEvents: 'لا توجد أحداث مجدولة',
        generalEvent: 'حدث عام',
      }
    : {
        labels: { CLASS: 'Class', EXAM: 'Exam', ASSIGNMENT_DEADLINE: 'Assignment', PAYMENT_DEADLINE: 'Payment' } as Record<EventType, string>,
        loadError: 'Failed to load calendar',
        createSuccess: 'Event created',
        createError: 'Failed to create event',
        board: 'Calendar Board',
        title: 'See classes, deadlines, and payment events in one view.',
        subtitle: 'The calendar is color-coded by event type so operational priorities stand out immediately.',
        prev: 'Prev',
        today: 'Today',
        next: 'Next',
        month: 'month',
        week: 'week',
        allTeachers: 'All teachers',
        allClasses: 'All classes',
        allStudents: 'All students',
        allTypes: 'All event types',
        eventTitle: 'Event title',
        description: 'Description',
        noTeacher: 'No teacher',
        noClass: 'No class',
        noStudent: 'No student',
        createEvent: 'Create Event',
        loading: 'Loading calendar...',
        noDays: 'No days found',
        noDaysMessage: 'Try another range.',
        noEvents: 'No events scheduled',
        generalEvent: 'General event',
      }
}

const EVENT_COLORS: Record<EventType, string> = { CLASS: '#8b5cf6', EXAM: '#3b82f6', ASSIGNMENT_DEADLINE: '#f59e0b', PAYMENT_DEADLINE: '#ef4444' }

function getRange(view: 'week' | 'month', anchor: Date) {
  if (view === 'week') {
    const from = startOfDay(anchor)
    from.setDate(from.getDate() - from.getDay())
    const to = new Date(from)
    to.setDate(to.getDate() + 6)
    to.setHours(23, 59, 59, 999)
    return { from, to }
  }
  const from = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const to = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59, 999)
  return { from, to }
}

function getDays(view: 'week' | 'month', anchor: Date) {
  const { from, to } = getRange(view, anchor)
  const days: Date[] = []
  const current = new Date(from)
  while (current <= to) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return days
}

export default function Calendar() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const copy = getCopy(locale)
  const noEventsTitle = locale === 'ar' ? 'لا توجد أحداث في هذا النطاق' : 'No events in this range'
  const noEventsMessage = locale === 'ar' ? 'قم بإنشاء حدث جديد أو غيّر الفلاتر/الفترة الزمنية.' : 'Create a new event or adjust filters/date range.'
  const requireTeacherClass = locale === 'ar' ? 'يجب اختيار المعلم والصف عند إنشاء حصة.' : 'Teacher and class are required for class sessions.'
  const isAdmin = user?.role === 'ADMIN'
  const isStudent = user?.role === 'STUDENT'
  const [meta, setMeta] = useState<CalendarMeta>({ students: [], teachers: [], classes: [] })
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'week' | 'month'>('month')
  const [anchor, setAnchor] = useState(() => new Date())
  const [filters, setFilters] = useState({ teacherId: '', studentId: '', classId: '', type: '' })
  const [form, setForm] = useState({ title: '', description: '', type: 'CLASS' as EventType, startAt: toInput(new Date()), endAt: '', relatedStudentId: '', relatedTeacherId: '', relatedClassId: '' })
  const dateTimePlaceholder = locale === 'ar' ? 'اختر التاريخ والوقت' : 'Choose date and time'

  const days = useMemo(() => getDays(view, anchor), [view, anchor])
  const dateLocale = locale === 'ar' ? 'ar' : 'en-GB'
  const formatDate = (date: Date) => date.toLocaleDateString(dateLocale, { day: '2-digit', month: 'short' })

  const loadMeta = useCallback(async () => {
    const res = await api.get('/calendar/meta')
    setMeta(res.data)
  }, [])

  const loadEvents = useCallback(async () => {
    const { from, to } = getRange(view, anchor)
    const res = await api.get('/calendar', { params: { from: from.toISOString(), to: to.toISOString(), ...filters } })
    setEvents(res.data.events)
  }, [view, anchor, filters])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        await loadMeta()
        await loadEvents()
      } catch {
        if (active) toast.error(copy.loadError)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [loadMeta, loadEvents, copy.loadError])

  useEffect(() => {
    if (loading) return
    void loadEvents()
  }, [filters, anchor, view, loading, loadEvents])

  async function createEvent() {
    if (!form.title || !form.startAt) return
    if (form.type === 'CLASS' && (!form.relatedTeacherId || !form.relatedClassId)) {
      toast.error(requireTeacherClass)
      return
    }
    try {
      await api.post('/calendar', {
        ...form,
        endAt: form.endAt || null,
        relatedStudentId: form.relatedStudentId || null,
        relatedTeacherId: form.relatedTeacherId || null,
        relatedClassId: form.relatedClassId || null,
      })
      setForm({ ...form, title: '', description: '' })
      await loadEvents()
      toast.success(copy.createSuccess)
    } catch {
      toast.error(copy.createError)
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const day of days) map.set(startOfDay(day).toISOString(), [])
    for (const event of events) {
      const key = startOfDay(new Date(event.startAt)).toISOString()
      if (map.has(key)) map.get(key)?.push(event)
    }
    return map
  }, [days, events])

  return (
    <div className="space-y-5 animate-fade-in">
      <section className="card p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(circle at top right, rgba(124,58,237,0.18), transparent 40%)' }} />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-faint)' }}>{copy.board}</p>
            <h2 className="text-[26px] font-extrabold mt-2" style={{ color: 'var(--text)' }}>{copy.title}</h2>
            <p className="text-[13px] mt-3 max-w-[680px]" style={{ color: 'var(--text-muted)' }}>{copy.subtitle}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(copy.labels).map(([value, label]) => (
              <span key={value} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold" style={{ color: EVENT_COLORS[value as EventType], background: `${EVENT_COLORS[value as EventType]}18` }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - (view === 'week' ? 7 : 30)))} className="btn-ghost px-3 py-2 text-[12px]">{copy.prev}</button>
          <button onClick={() => setAnchor(new Date())} className="btn-ghost px-3 py-2 text-[12px]">{copy.today}</button>
          <button onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + (view === 'week' ? 7 : 30)))} className="btn-ghost px-3 py-2 text-[12px]">{copy.next}</button>
          <span className="text-[13px] font-semibold ml-1" style={{ color: 'var(--text)' }}>{anchor.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })}</span>
        </div>
        <div className="flex gap-2">
          {(['month', 'week'] as const).map(item => (
            <button key={item} onClick={() => setView(item)} className="px-3 py-2 rounded-lg text-[12px] font-medium capitalize" style={{ background: view === item ? 'rgba(124,58,237,0.16)' : 'transparent', color: view === item ? '#a78bfa' : 'var(--text-muted)', border: `1px solid ${view === item ? 'rgba(124,58,237,0.32)' : 'var(--border)'}` }}>{item === 'month' ? copy.month : copy.week}</button>
          ))}
        </div>
      </section>

      <section className={`card p-4 grid gap-3 ${isStudent ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
        {!isStudent && (
          <select className="input" value={filters.teacherId} onChange={e => setFilters({ ...filters, teacherId: e.target.value })}>
            <option value="">{copy.allTeachers}</option>
            {meta.teachers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        )}
        <select className="input" value={filters.classId} onChange={e => setFilters({ ...filters, classId: e.target.value })}>
          <option value="">{copy.allClasses}</option>
          {meta.classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        {!isStudent && (
          <select className="input" value={filters.studentId} onChange={e => setFilters({ ...filters, studentId: e.target.value })}>
            <option value="">{copy.allStudents}</option>
            {meta.students.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        )}
        <select className="input" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
          <option value="">{copy.allTypes}</option>
          {Object.entries(copy.labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </section>

      {isAdmin && (
        <section className="card p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <input className="input" placeholder={copy.eventTitle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as EventType })}>
            {Object.entries(copy.labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input
            className="input"
            type={form.startAt ? 'datetime-local' : 'text'}
            lang="en-GB"
            placeholder={dateTimePlaceholder}
            title={dateTimePlaceholder}
            value={form.startAt}
            onFocus={e => asDateTimeInput(e.currentTarget)}
            onBlur={e => asTextInputWhenEmpty(e.currentTarget)}
            onChange={e => setForm({ ...form, startAt: e.target.value })}
          />
          <input
            className="input"
            type={form.endAt ? 'datetime-local' : 'text'}
            lang="en-GB"
            placeholder={dateTimePlaceholder}
            title={dateTimePlaceholder}
            value={form.endAt}
            onFocus={e => asDateTimeInput(e.currentTarget)}
            onBlur={e => asTextInputWhenEmpty(e.currentTarget)}
            onChange={e => setForm({ ...form, endAt: e.target.value })}
          />
          <input className="input md:col-span-2" placeholder={copy.description} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <select className="input" value={form.relatedTeacherId} onChange={e => setForm({ ...form, relatedTeacherId: e.target.value })}>
            <option value="">{copy.noTeacher}</option>
            {meta.teachers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="input" value={form.relatedClassId} onChange={e => setForm({ ...form, relatedClassId: e.target.value })}>
            <option value="">{copy.noClass}</option>
            {meta.classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="input" value={form.relatedStudentId} onChange={e => setForm({ ...form, relatedStudentId: e.target.value })}>
            <option value="">{copy.noStudent}</option>
            {meta.students.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <button
            onClick={createEvent}
            className="btn-primary px-4 py-2 text-[13px]"
            disabled={form.type === 'CLASS' && (!form.relatedTeacherId || !form.relatedClassId)}
          >
            {copy.createEvent}
          </button>
        </section>
      )}

      {loading ? (
        <div className="card p-8 text-[13px]" style={{ color: 'var(--text-muted)' }}>{copy.loading}</div>
      ) : days.length === 0 ? (
        <div className="card"><EmptyState title={copy.noDays} message={copy.noDaysMessage} /></div>
      ) : events.length === 0 ? (
        <div className="card"><EmptyState title={noEventsTitle} message={noEventsMessage} /></div>
      ) : (
        <section className={`grid gap-3 ${view === 'week' ? 'grid-cols-1 lg:grid-cols-7' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'}`}>
          {days.map(day => {
            const key = startOfDay(day).toISOString()
            const dayEvents = grouped.get(key) ?? []
            return (
              <div key={key} className="card p-4 min-h-[210px]">
                <div className="mb-4">
                  <p className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>{formatDate(day)}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{day.toLocaleDateString(dateLocale, { weekday: 'long' })}</p>
                </div>
                {dayEvents.length === 0 ? (
                  <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{copy.noEvents}</p>
                ) : (
                  <div className="space-y-2">
                    {dayEvents.map(event => (
                      <div key={event.id} className="rounded-xl p-3" style={{ background: `${EVENT_COLORS[event.type]}18`, border: `1px solid ${EVENT_COLORS[event.type]}30` }}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>{event.title}</span>
                          <span className="text-[10px] font-bold" style={{ color: EVENT_COLORS[event.type] }}>{copy.labels[event.type]}</span>
                        </div>
                        <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(event.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-[10px] mt-2" style={{ color: 'var(--text-faint)' }}>{[event.teacher?.name, event.class?.name, event.student?.name].filter(Boolean).join(' · ') || copy.generalEvent}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
