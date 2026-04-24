import { useCallback, useEffect, useState } from 'react'
import api from '../api/api'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { toast } from '../components/ui/Toast'
import { useLocale } from '../hooks/useLocale'
import { localizeAcademicLabel } from '../utils/academicLocalization'

interface StudentOption { id: number; name: string }
interface ParentItem {
  id: number
  name: string
  email: string | null
  phone: string | null
  studentLinks: Array<{ id: number; relationType: string; student: { id: number; name: string; course: string; status: string } }>
}

interface ParentOverview {
  parent: { id: number; name: string; email: string | null; phone: string | null }
  students: Array<{
    relationType: string
    student: { id: number; name: string; status: string; course: string }
    academicSummary: { gpa: number | null; totalSubjects: number; totalEarnedCredits: number }
    attendanceRate: number
    outstanding: number
  }>
  communications: Array<{ id: number; subject: string; status: string; createdAt: string }>
}

function getCopy(locale: 'ar' | 'en') {
  return locale === 'ar'
    ? {
        loadDataError: 'تعذر تحميل بيانات أولياء الأمور',
        loadOverviewError: 'تعذر تحميل ملخص ولي الأمر',
        createSuccess: 'تم إنشاء ولي الأمر بنجاح',
        createError: 'تعذر إنشاء ولي الأمر',
        linkSuccess: 'تم ربط ولي الأمر بالطالب',
        linkError: 'تعذر ربط ولي الأمر بالطالب',
        addParent: 'إضافة ولي أمر',
        cancel: 'إلغاء',
        create: 'إنشاء',
        parentName: 'اسم ولي الأمر',
        email: 'البريد الإلكتروني',
        phone: 'رقم الهاتف',
        linkStudent: 'ربط طالب',
        link: 'ربط',
        selectStudent: 'اختر الطالب',
        relationType: 'صلة القرابة',
        portal: 'بوابة أولياء الأمور',
        portalSubtitle: 'أولياء الأمور والطلاب المرتبطون',
        noParents: 'لا يوجد أولياء أمور بعد',
        noParentsMessage: 'قم بإنشاء ملف ولي أمر لربطه بالطلاب.',
        selectParent: 'اختر ولي أمر',
        selectParentMessage: 'اختر ملف ولي أمر لعرض الطلاب المرتبطين والملخصات.',
        notAvailable: 'غير متاح',
        attendance: 'الحضور',
        subjects: 'المواد',
        outstanding: 'المستحقات',
        currency: 'ر.س',
      }
    : {
        loadDataError: 'Failed to load parents data',
        loadOverviewError: 'Failed to load parent overview',
        createSuccess: 'Parent created successfully',
        createError: 'Failed to create parent',
        linkSuccess: 'Parent linked to student',
        linkError: 'Failed to link parent',
        addParent: 'Add Parent',
        cancel: 'Cancel',
        create: 'Create',
        parentName: 'Parent name',
        email: 'Email',
        phone: 'Phone',
        linkStudent: 'Link Student',
        link: 'Link',
        selectStudent: 'Select student',
        relationType: 'Relation type',
        portal: 'Parent Portal',
        portalSubtitle: 'Guardians and linked students',
        noParents: 'No parents yet',
        noParentsMessage: 'Create a parent profile to link it with students.',
        selectParent: 'Select a parent',
        selectParentMessage: 'Choose a parent profile to view linked students and summaries.',
        notAvailable: 'N/A',
        attendance: 'Attendance',
        subjects: 'Subjects',
        outstanding: 'Outstanding',
        currency: 'SAR',
      }
}

export default function Parents() {
  const { locale } = useLocale()
  const copy = getCopy(locale)
  const [parents, setParents] = useState<ParentItem[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [selectedParent, setSelectedParent] = useState<ParentOverview | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [linkForm, setLinkForm] = useState({ studentId: '', relationType: 'Guardian' })

  const loadData = useCallback(async () => {
    try {
      const [parentsRes, studentsRes] = await Promise.all([
        api.get('/parents'),
        api.get('/students'),
      ])
      setParents(parentsRes.data.parents ?? [])
      setStudents((studentsRes.data.students ?? []).map((item: StudentOption) => ({ id: item.id, name: item.name })))
    } catch {
      toast.error(copy.loadDataError)
    }
  }, [copy.loadDataError])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

  async function loadOverview(parentId: number) {
    try {
      const res = await api.get(`/parents/${parentId}`)
      setSelectedParent(res.data)
    } catch {
      toast.error(copy.loadOverviewError)
    }
  }

  async function handleCreateParent() {
    try {
      await api.post('/parents', form)
      setCreateOpen(false)
      setForm({ name: '', email: '', phone: '' })
      await loadData()
      toast.success(copy.createSuccess)
    } catch {
      toast.error(copy.createError)
    }
  }

  async function handleLinkStudent(parentId: number) {
    try {
      await api.post(`/parents/${parentId}/link-student`, linkForm)
      setLinkOpen(null)
      setLinkForm({ studentId: '', relationType: 'Guardian' })
      await loadData()
      await loadOverview(parentId)
      toast.success(copy.linkSuccess)
    } catch {
      toast.error(copy.linkError)
    }
  }

  return (
    <div className="space-y-5">
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={copy.addParent}
        footer={(
          <div className="flex gap-2">
            <button onClick={() => setCreateOpen(false)} className="btn-ghost flex-1 py-2 rounded-xl">{copy.cancel}</button>
            <button onClick={() => void handleCreateParent()} className="btn-primary flex-1 py-2 rounded-xl">{copy.create}</button>
          </div>
        )}
      >
        <div className="space-y-3">
          <input className="input" placeholder={copy.parentName} value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} />
          <input className="input" placeholder={copy.email} value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} />
          <input className="input" placeholder={copy.phone} value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} />
        </div>
      </Modal>

      <Modal
        open={Boolean(linkOpen)}
        onClose={() => setLinkOpen(null)}
        title={copy.linkStudent}
        footer={(
          <div className="flex gap-2">
            <button onClick={() => setLinkOpen(null)} className="btn-ghost flex-1 py-2 rounded-xl">{copy.cancel}</button>
            <button onClick={() => { if (linkOpen) void handleLinkStudent(linkOpen) }} className="btn-primary flex-1 py-2 rounded-xl">{copy.link}</button>
          </div>
        )}
      >
        <div className="space-y-3">
          <select className="input" value={linkForm.studentId} onChange={(e) => setLinkForm((current) => ({ ...current, studentId: e.target.value }))}>
            <option value="">{copy.selectStudent}</option>
            {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
          </select>
          <input className="input" placeholder={copy.relationType} value={linkForm.relationType} onChange={(e) => setLinkForm((current) => ({ ...current, relationType: e.target.value }))} />
        </div>
      </Modal>

      <section className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{copy.portal}</h3>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{copy.portalSubtitle}</p>
            </div>
            <button onClick={() => setCreateOpen(true)} className="btn-primary px-3 py-2 rounded-xl text-[12px]">{copy.addParent}</button>
          </div>
          <div className="space-y-2">
            {parents.length === 0 ? (
              <EmptyState title={copy.noParents} message={copy.noParentsMessage} />
            ) : parents.map((parent) => (
              <button
                key={parent.id}
                onClick={() => void loadOverview(parent.id)}
                className="w-full rounded-2xl p-4 text-left"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{parent.name}</p>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{parent.email || parent.phone || '-'}</p>
                  </div>
                  <span className="badge badge-purple">{parent.studentLinks.length}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setLinkOpen(parent.id) }} className="btn-ghost mt-3 px-3 py-1.5 text-[11px]">{copy.linkStudent}</button>
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          {!selectedParent ? (
            <EmptyState title={copy.selectParent} message={copy.selectParentMessage} />
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>{selectedParent.parent.name}</h3>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{selectedParent.parent.email || selectedParent.parent.phone || '-'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedParent.students.map((entry) => (
                  <div key={entry.student.id} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{entry.student.name}</p>
                        <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{entry.relationType} • {localizeAcademicLabel(entry.student.course, locale)}</p>
                      </div>
                      <span className="badge badge-info">{entry.academicSummary.gpa === null ? copy.notAvailable : entry.academicSummary.gpa.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4 text-[11px]">
                      <div><p style={{ color: 'var(--text-faint)' }}>{copy.attendance}</p><p style={{ color: 'var(--text)' }}>{entry.attendanceRate}%</p></div>
                      <div><p style={{ color: 'var(--text-faint)' }}>{copy.subjects}</p><p style={{ color: 'var(--text)' }}>{entry.academicSummary.totalSubjects}</p></div>
                      <div><p style={{ color: 'var(--text-faint)' }}>{copy.outstanding}</p><p style={{ color: 'var(--text)' }}>{entry.outstanding.toLocaleString()} {copy.currency}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
