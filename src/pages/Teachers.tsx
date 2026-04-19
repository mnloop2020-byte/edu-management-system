import { useState, useEffect, useCallback } from 'react'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/ui/Toast'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'

interface Teacher { id: number; name: string; subject: string; phone: string | null; classes: number }
type TeacherFormKey = 'name' | 'subject' | 'phone'

// Unsplash teacher avatars (stable URLs)
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

const ACCENT_COLORS = ['#7c3aed','#0284c7','#059669','#d97706','#db2777','#0891b2']

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function Avatar({ name, index }: { name: string; index: number }) {
  const [err, setErr] = useState(false)
  const color = ACCENT_COLORS[index % ACCENT_COLORS.length]
  const photo = TEACHER_PHOTOS[index % TEACHER_PHOTOS.length]

  if (!err) return (
    <img
      src={photo} alt={name}
      onError={() => setErr(true)}
      style={{
        width: 44, height: 44, borderRadius: 12,
        objectFit: 'cover',
        border: `2px solid ${color}30`,
      }}
    />
  )
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: `${color}20`, border: `2px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700, color,
    }}>
      {getInitials(name)}
    </div>
  )
}

export default function Teachers() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', subject: '', phone: '', classes: '0' })
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [delLoading, setDelLoading] = useState(false)

  const fetchTeachers = useCallback(async () => {
    try { setLoading(true); setError(''); const res = await api.get('/teachers'); setTeachers(res.data.teachers) }
    catch { setError('Failed to load teachers') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTeachers() }, [fetchTeachers])

  function openAdd() { setForm({ name: '', subject: '', phone: '', classes: '0' }); setEditId(null); setShowModal(true) }
  function openEdit(t: Teacher) { setForm({ name: t.name, subject: t.subject, phone: t.phone || '', classes: String(t.classes) }); setEditId(t.id); setShowModal(true) }

  async function handleSave() {
    if (!isAdmin || !form.name || !form.subject) return
    setSaving(true)
    try {
      const payload = { name: form.name, subject: form.subject, phone: form.phone, classes: Number(form.classes) }
      if (editId !== null) await api.put(`/teachers/${editId}`, payload)
      else await api.post('/teachers', payload)
      await fetchTeachers(); setShowModal(false)
      toast.success(editId ? 'Teacher updated!' : 'Teacher added!')
    } catch { toast.error('Failed to save teacher') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDelLoading(true)
    try {
      await api.delete(`/teachers/${deleteId}`)
      setTeachers(prev => prev.filter(t => t.id !== deleteId))
      toast.success('Teacher deleted.')
    } catch { toast.error('Failed to delete teacher') }
    finally { setDelLoading(false); setDeleteId(null) }
  }

  const stats = [
    { label: 'Total Teachers', value: teachers.length, color: 'var(--text)' },
    { label: 'Total Classes', value: teachers.reduce((s, t) => s + t.classes, 0), color: '#a78bfa' },
    { label: 'Avg Classes', value: teachers.length ? Math.round(teachers.reduce((s, t) => s + t.classes, 0) / teachers.length) : 0, color: '#60a5fa' },
  ]

  const FIELDS: Array<{ label: string; key: TeacherFormKey; placeholder: string }> = [
    { label: 'Full Name *', key: 'name', placeholder: 'Teacher name' },
    { label: 'Subject *', key: 'subject', placeholder: 'e.g. Mathematics' },
    { label: 'Phone', key: 'phone', placeholder: '05xxxxxxxx' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <ConfirmDialog open={deleteId !== null} title="Delete Teacher"
        message={`Remove "${deleteName}" from the faculty? This cannot be undone.`}
        confirmLabel={delLoading ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />

      <Modal open={showModal && isAdmin} onClose={() => setShowModal(false)}
        title={editId ? 'Edit Teacher' : 'Add Teacher'}
        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
        footer={
          <div className="flex gap-2.5">
            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-[13px] btn-ghost rounded-xl">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name || !form.subject} className="flex-1 py-2.5 text-[13px] btn-primary rounded-xl">
              {saving ? 'Saving...' : editId ? 'Save Changes' : 'Add Teacher'}
            </button>
          </div>
        }>
        <div className="flex flex-col gap-4">
          {FIELDS.map((f: { label: string; key: TeacherFormKey; placeholder: string }) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
              <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder} className="input" />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>Number of Classes</label>
            <input type="number" value={form.classes} onChange={e => setForm({ ...form, classes: e.target.value })}
              placeholder="0" className="input" min="0" />
          </div>
        </div>
      </Modal>

      {/* Header */}
      <div className="flex justify-end">
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 px-4 py-2 text-[13px]" style={{ borderRadius: 12 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Teacher
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(item => (
          <div key={item.label} className="card px-5 py-4 flex items-center justify-between">
            <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
            <span className="text-[22px] font-extrabold" style={{ color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="skeleton rounded-xl" style={{ width: 44, height: 44 }} />
                <div className="flex flex-col gap-2 flex-1">
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
          <EmptyState title="Failed to load" message={error} action={{ label: 'Retry', onClick: fetchTeachers }} />
        </div>
      ) : teachers.length === 0 ? (
        <div className="card">
          <EmptyState title="No teachers yet" message="Add your first teacher to get started."
            action={isAdmin ? { label: 'Add Teacher', onClick: openAdd } : undefined} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teachers.map((t, i) => (
            <div key={t.id} className="card card-glow p-5 group" style={{ transition: 'all .25s' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div style={{ flexShrink: 0 }}>
                    <Avatar name={t.name} index={i} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold leading-snug" style={{ color: 'var(--text)' }}>{t.name}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.subject}</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(t)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: 'var(--text-faint)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button onClick={() => { setDeleteId(t.id); setDeleteName(t.name) }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: 'var(--text-faint)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span className="text-[12px]">{t.classes} classes</span>
                </div>
                {t.phone && (
                  <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 4.69 13.3a19.5 19.5 0 0 1-5.06-5.94 2 2 0 0 1 .48-2.35L3.6 2.48a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6"/>
                    </svg>
                    <span className="text-[12px]">{t.phone}</span>
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
