import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import { EmptyState } from '../components/ui/EmptyState'
import { toast } from '../components/ui/Toast'
import { useLocale } from '../hooks/useLocale'

interface OfferingItem {
  id: number
  section: string
  subject: { id: number; name: string; code: string; creditHours: number }
  semester: { id: number; name: string; code: string }
  teacher: { id: number; name: string } | null
  studentsCount: number
}

interface GradebookRow {
  enrollmentId: number
  studentId: number
  studentName: string
  studentStatus: string
  midterm: number | null
  finalExam: number | null
  coursework: number | null
  totalScore: number | null
  finalLetterGrade: string
  passStatus: string
  calculationStatus: string
}

interface GradebookDetails {
  offering: {
    id: number
    section: string
    subject: { id: number; name: string; code: string; creditHours: number }
    semester: { id: number; name: string; code: string }
    teacher: { id: number; name: string } | null
    gradingPolicy: {
      components: Array<{ code: string; label: string; weight: number }>
    }
  }
  rows: GradebookRow[]
}

interface DraftRow {
  midterm: string
  finalExam: string
  coursework: string
}

export default function Gradebook() {
  const { locale } = useLocale()
  const copy = locale === 'ar'
    ? {
        loading: 'جاري تحميل دفتر الدرجات...',
        loadError: 'تعذر تحميل دفتر الدرجات',
        saveSuccess: 'تم حفظ الدرجات بنجاح',
        saveError: 'تعذر حفظ الدرجات',
        noOfferings: 'لا توجد مواد مطروحة',
        noOfferingsMessage: 'أنشئ مادة مطروحة أو اربط معلماً بمادة لبدء دفتر الدرجات.',
        saveAll: 'حفظ الكل',
        saving: 'جاري الحفظ...',
        students: 'الطلاب',
        teacher: 'المعلم',
        rule: 'معادلة الحساب',
      }
    : {
        loading: 'Loading gradebook...',
        loadError: 'Failed to load gradebook',
        saveSuccess: 'Grades saved successfully',
        saveError: 'Failed to save grades',
        noOfferings: 'No offerings yet',
        noOfferingsMessage: 'Create a subject offering or assign a teacher to start the gradebook.',
        saveAll: 'Save All',
        saving: 'Saving...',
        students: 'Students',
        teacher: 'Teacher',
        rule: 'Calculation Rule',
      }

  const [offerings, setOfferings] = useState<OfferingItem[]>([])
  const [selectedOfferingId, setSelectedOfferingId] = useState<number | null>(null)
  const [details, setDetails] = useState<GradebookDetails | null>(null)
  const [drafts, setDrafts] = useState<Record<number, DraftRow>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadGradebook = useCallback(async (offeringId: number) => {
    const res = await api.get(`/gradebook/offerings/${offeringId}`)
    const payload = res.data as GradebookDetails
    setDetails(payload)
    setDrafts(
      Object.fromEntries(
        payload.rows.map((row) => [row.enrollmentId, {
          midterm: row.midterm?.toString() ?? '',
          finalExam: row.finalExam?.toString() ?? '',
          coursework: row.coursework?.toString() ?? '',
        }]),
      ),
    )
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await api.get('/gradebook/offerings')
        if (!active) return
        const items = res.data.offerings ?? []
        setOfferings(items)
        setSelectedOfferingId((current) => current ?? items[0]?.id ?? null)
      } catch {
        if (active) toast.error(copy.loadError)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [copy.loadError])

  useEffect(() => {
    if (!selectedOfferingId) return
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        await loadGradebook(selectedOfferingId)
      } catch {
        if (active) toast.error(copy.loadError)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [selectedOfferingId, copy.loadError, loadGradebook])

  const weightSummary = useMemo(() => {
    const components = details?.offering.gradingPolicy.components ?? []
    if (components.length === 0) return locale === 'ar' ? 'الميد 40% + الفاينل 60%' : 'Midterm 40% + Final 60%'
    return components
      .filter((item) => Number(item.weight) > 0)
      .map((item) => `${item.label} ${Number(item.weight)}%`)
      .join(' + ')
  }, [details, locale])

  async function handleSaveAll() {
    if (!selectedOfferingId || !details) return
    setSaving(true)
    try {
      await api.patch(`/gradebook/offerings/${selectedOfferingId}/bulk`, {
        entries: details.rows.map((row) => ({
          enrollmentId: row.enrollmentId,
          midterm: drafts[row.enrollmentId]?.midterm === '' ? null : Number(drafts[row.enrollmentId]?.midterm),
          finalExam: drafts[row.enrollmentId]?.finalExam === '' ? null : Number(drafts[row.enrollmentId]?.finalExam),
          coursework: drafts[row.enrollmentId]?.coursework === '' ? null : Number(drafts[row.enrollmentId]?.coursework),
        })),
      })
      await loadGradebook(selectedOfferingId)
      toast.success(copy.saveSuccess)
    } catch {
      toast.error(copy.saveError)
    } finally {
      setSaving(false)
    }
  }

  if (loading && offerings.length === 0) {
    return <div className="card p-6 text-[13px]" style={{ color: 'var(--text-muted)' }}>{copy.loading}</div>
  }

  if (offerings.length === 0) {
    return <div className="card"><EmptyState title={copy.noOfferings} message={copy.noOfferingsMessage} /></div>
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
        <div className="card p-4 space-y-2">
          {offerings.map((offering) => {
            const active = offering.id === selectedOfferingId
            return (
              <button
                key={offering.id}
                onClick={() => setSelectedOfferingId(offering.id)}
                className="w-full text-left rounded-2xl p-4 transition-all"
                style={{
                  background: active ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? 'rgba(124,58,237,0.28)' : 'var(--border)'}`,
                }}
              >
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{offering.subject.name}</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  {offering.subject.code} • {offering.semester.name} • {offering.section}
                </p>
                <div className="flex items-center justify-between mt-3 text-[11px]" style={{ color: 'var(--text-faint)' }}>
                  <span>{copy.students}: {offering.studentsCount}</span>
                  <span>{copy.teacher}: {offering.teacher?.name || '—'}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>
                {details?.offering.subject.name} {details ? `• ${details.offering.section}` : ''}
              </h3>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {copy.rule}: {weightSummary}
              </p>
            </div>
            <button onClick={() => void handleSaveAll()} disabled={saving} className="btn-primary px-4 py-2 rounded-xl text-[12px]">
              {saving ? copy.saving : copy.saveAll}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Student', 'Midterm', 'Final', 'Coursework', 'Total', 'Grade', 'Status'].map((header) => (
                    <th key={header} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(details?.rows ?? []).map((row) => (
                  <tr key={row.enrollmentId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-5 py-4">
                      <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{row.studentName}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{row.studentStatus}</p>
                    </td>
                    <td className="px-5 py-4"><input type="number" className="input h-9 text-[12px]" value={drafts[row.enrollmentId]?.midterm ?? ''} onChange={(e) => setDrafts((current) => ({ ...current, [row.enrollmentId]: { ...(current[row.enrollmentId] || { midterm: '', finalExam: '', coursework: '' }), midterm: e.target.value } }))} /></td>
                    <td className="px-5 py-4"><input type="number" className="input h-9 text-[12px]" value={drafts[row.enrollmentId]?.finalExam ?? ''} onChange={(e) => setDrafts((current) => ({ ...current, [row.enrollmentId]: { ...(current[row.enrollmentId] || { midterm: '', finalExam: '', coursework: '' }), finalExam: e.target.value } }))} /></td>
                    <td className="px-5 py-4"><input type="number" className="input h-9 text-[12px]" value={drafts[row.enrollmentId]?.coursework ?? ''} onChange={(e) => setDrafts((current) => ({ ...current, [row.enrollmentId]: { ...(current[row.enrollmentId] || { midterm: '', finalExam: '', coursework: '' }), coursework: e.target.value } }))} /></td>
                    <td className="px-5 py-4 text-[12px]" style={{ color: 'var(--text)' }}>{row.totalScore === null ? 'N/A' : `${row.totalScore.toFixed(1)}%`}</td>
                    <td className="px-5 py-4"><span className="badge badge-purple">{row.finalLetterGrade}</span></td>
                    <td className="px-5 py-4"><span className={`badge ${row.passStatus === 'PASS' ? 'badge-success' : row.passStatus === 'FAIL' ? 'badge-error' : 'badge-warning'}`}>{row.passStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
