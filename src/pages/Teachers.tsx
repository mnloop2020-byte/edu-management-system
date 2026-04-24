import { useState, useEffect, useCallback } from 'react'
import type { ChangeEvent } from 'react'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../hooks/useLocale'
import { toast } from '../components/ui/Toast'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'

interface Teacher {
  id: number
  name: string
  subject: string
  phone: string | null
  classes: number
  avatarUrl: string | null
}

type TeacherFormKey = 'name' | 'subject' | 'phone'

const TEACHER_PHOTOS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=75',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&q=75',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=75',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&q=75',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=75',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=75',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&q=75',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=80&q=75',
]

const ACCENT_COLORS = ['#7c3aed', '#0284c7', '#059669', '#d97706', '#db2777', '#0891b2']

function getCopy(locale: 'ar' | 'en') {
  return locale === 'ar'
    ? {
        loadError: 'تعذر تحميل المعلمين',
        saveError: 'تعذر حفظ المعلم',
        deleteError: 'تعذر حذف المعلم',
        updated: 'تم تحديث المعلم',
        added: 'تمت إضافة المعلم',
        deleted: 'تم حذف المعلم',
        deleteTeacher: 'حذف معلم',
        deleteMessage: 'هل تريد حذف',
        deleting: 'جارٍ الحذف...',
        delete: 'حذف',
        editTeacher: 'تعديل معلم',
        addTeacher: 'إضافة معلم',
        cancel: 'إلغاء',
        saving: 'جارٍ الحفظ...',
        saveChanges: 'حفظ التعديلات',
        fullName: 'الاسم الكامل *',
        teacherName: 'اسم المعلم',
        subject: 'المادة *',
        subjectPlaceholder: 'مثال: الرياضيات',
        phone: 'الهاتف',
        phonePlaceholder: '05xxxxxxxx',
        uploadPhoto: 'رفع صورة',
        removePhoto: 'إزالة الصورة',
        uploadPhotoHint: 'اختر صورة من جهازك وسيتم حفظها مباشرة.',
        photoError: 'تعذر معالجة الصورة',
        numberOfClasses: 'عدد الصفوف',
        totalTeachers: 'إجمالي المعلمين',
        totalClasses: 'إجمالي الصفوف',
        avgClasses: 'متوسط الصفوف',
        classes: 'صفوف',
        retry: 'إعادة المحاولة',
        failedToLoad: 'فشل التحميل',
        noTeachers: 'لا يوجد معلمون بعد',
        noTeachersMessage: 'أضف أول معلم للبدء.',
      }
    : {
        loadError: 'Failed to load teachers',
        saveError: 'Failed to save teacher',
        deleteError: 'Failed to delete teacher',
        updated: 'Teacher updated!',
        added: 'Teacher added!',
        deleted: 'Teacher deleted.',
        deleteTeacher: 'Delete Teacher',
        deleteMessage: 'Remove',
        deleting: 'Deleting...',
        delete: 'Delete',
        editTeacher: 'Edit Teacher',
        addTeacher: 'Add Teacher',
        cancel: 'Cancel',
        saving: 'Saving...',
        saveChanges: 'Save Changes',
        fullName: 'Full Name *',
        teacherName: 'Teacher name',
        subject: 'Subject *',
        subjectPlaceholder: 'e.g. Mathematics',
        phone: 'Phone',
        phonePlaceholder: '05xxxxxxxx',
        uploadPhoto: 'Upload Photo',
        removePhoto: 'Remove Photo',
        uploadPhotoHint: 'Choose an image from your device and it will be saved directly.',
        photoError: 'Failed to process image',
        numberOfClasses: 'Number of Classes',
        totalTeachers: 'Total Teachers',
        totalClasses: 'Total Classes',
        avgClasses: 'Avg Classes',
        classes: 'classes',
        retry: 'Retry',
        failedToLoad: 'Failed to load',
        noTeachers: 'No teachers yet',
        noTeachersMessage: 'Add your first teacher to get started.',
      }
}

function getInitials(name: string) {
  return name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()
}

function Avatar({ name, index, avatarUrl }: { name: string; index: number; avatarUrl?: string | null }) {
  const [err, setErr] = useState(false)
  const color = ACCENT_COLORS[index % ACCENT_COLORS.length]
  const photo = avatarUrl || TEACHER_PHOTOS[index % TEACHER_PHOTOS.length]

  if (!err) {
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setErr(true)}
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          objectFit: 'cover',
          border: `2px solid ${color}30`,
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: `${color}20`,
        border: `2px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        color,
      }}
    >
      {getInitials(name)}
    </div>
  )
}

async function fileToAvatarDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      const maxSide = 320
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
      const width = Math.max(1, Math.round(image.width * scale))
      const height = Math.max(1, Math.round(image.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')

      if (!context) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Canvas not supported'))
        return
      }

      context.drawImage(image, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (!blob) {
          URL.revokeObjectURL(objectUrl)
          reject(new Error('Failed to process image'))
          return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
          URL.revokeObjectURL(objectUrl)
          resolve(String(reader.result || ''))
        }
        reader.onerror = () => {
          URL.revokeObjectURL(objectUrl)
          reject(new Error('Failed to read image'))
        }
        reader.readAsDataURL(blob)
      }, 'image/jpeg', 0.82)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Invalid image file'))
    }

    image.src = objectUrl
  })
}

export default function Teachers() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const copy = getCopy(locale)
  const isAdmin = user?.role === 'ADMIN'

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', subject: '', phone: '', avatarUrl: '', classes: '0' })
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [delLoading, setDelLoading] = useState(false)

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await api.get('/teachers')
      setTeachers(res.data.teachers)
    } catch {
      setError(copy.loadError)
    } finally {
      setLoading(false)
    }
  }, [copy.loadError])

  useEffect(() => {
    void fetchTeachers()
  }, [fetchTeachers])

  function openAdd() {
    setForm({ name: '', subject: '', phone: '', avatarUrl: '', classes: '0' })
    setEditId(null)
    setShowModal(true)
  }

  function openEdit(teacher: Teacher) {
    setForm({
      name: teacher.name,
      subject: teacher.subject,
      phone: teacher.phone || '',
      avatarUrl: teacher.avatarUrl || '',
      classes: String(teacher.classes),
    })
    setEditId(teacher.id)
    setShowModal(true)
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const avatarUrl = await fileToAvatarDataUrl(file)
      setForm((current) => ({ ...current, avatarUrl }))
    } catch {
      toast.error(copy.photoError)
    } finally {
      event.target.value = ''
      setUploadingImage(false)
    }
  }

  async function handleSave() {
    if (!isAdmin || !form.name || !form.subject) return

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        subject: form.subject,
        phone: form.phone,
        avatarUrl: form.avatarUrl || null,
        classes: Number(form.classes),
      }

      if (editId !== null) {
        await api.put(`/teachers/${editId}`, payload)
      } else {
        await api.post('/teachers', payload)
      }

      await fetchTeachers()
      setShowModal(false)
      toast.success(editId ? copy.updated : copy.added)
    } catch {
      toast.error(copy.saveError)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return

    setDelLoading(true)
    try {
      await api.delete(`/teachers/${deleteId}`)
      setTeachers((previous) => previous.filter((teacher) => teacher.id !== deleteId))
      toast.success(copy.deleted)
    } catch {
      toast.error(copy.deleteError)
    } finally {
      setDelLoading(false)
      setDeleteId(null)
    }
  }

  const stats = [
    { label: copy.totalTeachers, value: teachers.length, color: 'var(--text)' },
    { label: copy.totalClasses, value: teachers.reduce((sum, teacher) => sum + teacher.classes, 0), color: '#a78bfa' },
    { label: copy.avgClasses, value: teachers.length ? Math.round(teachers.reduce((sum, teacher) => sum + teacher.classes, 0) / teachers.length) : 0, color: '#60a5fa' },
  ]

  const fields: Array<{ label: string; key: TeacherFormKey; placeholder: string }> = [
    { label: copy.fullName, key: 'name', placeholder: copy.teacherName },
    { label: copy.subject, key: 'subject', placeholder: copy.subjectPlaceholder },
    { label: copy.phone, key: 'phone', placeholder: copy.phonePlaceholder },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <ConfirmDialog
        open={deleteId !== null}
        title={copy.deleteTeacher}
        message={`${copy.deleteMessage} "${deleteName}"?`}
        confirmLabel={delLoading ? copy.deleting : copy.delete}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <Modal
        open={showModal && isAdmin}
        onClose={() => setShowModal(false)}
        title={editId ? copy.editTeacher : copy.addTeacher}
        icon={(
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
        footer={(
          <div className="flex gap-2.5">
            <button onClick={() => setShowModal(false)} className="btn-ghost flex-1 rounded-xl py-2.5 text-[13px]">{copy.cancel}</button>
            <button
              onClick={handleSave}
              disabled={saving || uploadingImage || !form.name || !form.subject}
              className="btn-primary flex-1 rounded-xl py-2.5 text-[13px]"
            >
              {saving ? copy.saving : editId ? copy.saveChanges : copy.addTeacher}
            </button>
          </div>
        )}
      >
        <div className="flex flex-col gap-4">
          {fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{field.label}</label>
              <input
                value={form[field.key]}
                onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                placeholder={field.placeholder}
                className="input"
              />
            </div>
          ))}

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{copy.uploadPhoto}</label>
            <div className="flex items-center gap-3">
              <Avatar name={form.name || copy.teacherName} index={0} avatarUrl={form.avatarUrl || null} />
              <div className="flex flex-wrap items-center gap-2">
                <label className="btn-ghost cursor-pointer rounded-xl px-4 py-2 text-[12px]">
                  {uploadingImage ? copy.saving : copy.uploadPhoto}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
                {form.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, avatarUrl: '' }))}
                    className="btn-ghost rounded-xl px-4 py-2 text-[12px]"
                  >
                    {copy.removePhoto}
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{copy.uploadPhotoHint}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{copy.numberOfClasses}</label>
            <input
              type="number"
              value={form.classes}
              onChange={(event) => setForm({ ...form, classes: event.target.value })}
              placeholder="0"
              className="input"
              min="0"
            />
          </div>
        </div>
      </Modal>

      <div className="flex justify-end">
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 px-4 py-2 text-[13px]" style={{ borderRadius: 12 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {copy.addTeacher}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((item) => (
          <div key={item.label} className="card flex items-center justify-between px-5 py-4">
            <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
            <span className="text-[22px] font-extrabold" style={{ color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="skeleton rounded-xl" style={{ width: 44, height: 44 }} />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="skeleton" style={{ width: '60%', height: 14 }} />
                  <div className="skeleton" style={{ width: '40%', height: 12 }} />
                </div>
              </div>
              <div className="skeleton" style={{ height: 1, marginBottom: 16 }} />
              <div className="skeleton" style={{ width: '50%', height: 12 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card p-6">
          <EmptyState title={copy.failedToLoad} message={error} action={{ label: copy.retry, onClick: fetchTeachers }} />
        </div>
      ) : teachers.length === 0 ? (
        <div className="card">
          <EmptyState title={copy.noTeachers} message={copy.noTeachersMessage} action={isAdmin ? { label: copy.addTeacher, onClick: openAdd } : undefined} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teachers.map((teacher, index) => (
            <div key={teacher.id} className="card card-glow group p-5" style={{ transition: 'all .25s' }}>
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div style={{ flexShrink: 0 }}>
                    <Avatar name={teacher.name} index={index} avatarUrl={teacher.avatarUrl} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold leading-snug" style={{ color: 'var(--text)' }}>{teacher.name}</p>
                    <p className="mt-0.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>{teacher.subject}</p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(teacher)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                      style={{ color: 'var(--text-faint)' }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.color = 'var(--text)'
                        event.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.color = 'var(--text-faint)'
                        event.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setDeleteId(teacher.id)
                        setDeleteName(teacher.name)
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                      style={{ color: 'var(--text-faint)' }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.color = '#f87171'
                        event.currentTarget.style.background = 'rgba(248,113,113,0.1)'
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.color = 'var(--text-faint)'
                        event.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span className="text-[12px]">{teacher.classes} {copy.classes}</span>
                </div>

                {teacher.phone && (
                  <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 4.69 13.3a19.5 19.5 0 0 1-5.06-5.94 2 2 0 0 1 .48-2.35L3.6 2.48a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6" />
                    </svg>
                    <span className="text-[12px]">{teacher.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
