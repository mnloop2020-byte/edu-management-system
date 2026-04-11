import { useState, useEffect } from 'react'
import api from '../api/api'

interface Teacher {
  id: number
  name: string
  subject: string
  phone: string | null
  classes: number
}

const avatarColors = [
  'from-violet-500 to-indigo-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-pink-500 to-rose-600',
]

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-white/40 font-medium">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-[13px] text-white/80 placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors" />
    </div>
  )
}

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', subject: '', phone: '' })
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchTeachers() }, [])

  async function fetchTeachers() {
    try {
      setLoading(true)
      const res = await api.get('/teachers')
      setTeachers(res.data.teachers)
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setForm({ name: '', subject: '', phone: '' })
    setEditId(null)
    setShowModal(true)
  }

  function openEdit(t: Teacher) {
    setForm({ name: t.name, subject: t.subject, phone: t.phone || '' })
    setEditId(t.id)
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name || !form.subject) return
    setSaving(true)
    try {
      if (editId !== null) {
        await api.put(`/teachers/${editId}`, form)
      } else {
        await api.post('/teachers', form)
      }
      await fetchTeachers()
      setShowModal(false)
    } catch {
      alert('Failed to save teacher')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this teacher?')) return
    try {
      await api.delete(`/teachers/${id}`)
      setTeachers(prev => prev.filter(t => t.id !== id))
    } catch {
      alert('Failed to delete teacher')
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
      <div className="flex justify-end">
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 transition-colors text-white text-[13px] font-medium px-4 py-2 rounded-xl">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Teacher
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Teachers', value: teachers.length, color: 'text-white' },
          { label: 'Total Classes',  value: teachers.reduce((s, t) => s + t.classes, 0), color: 'text-violet-400' },
          { label: 'Avg Classes',    value: teachers.length ? Math.round(teachers.reduce((s, t) => s + t.classes, 0) / teachers.length) : 0, color: 'text-blue-400' },
        ].map(item => (
          <div key={item.label} className="bg-[#111318] border border-white/[0.06] rounded-2xl px-5 py-4 flex items-center justify-between">
            <span className="text-[12px] text-white/40">{item.label}</span>
            <span className={`text-[22px] font-bold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {teachers.map((t, i) => (
          <div key={t.id} className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.1] transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-[13px] font-bold text-white`}>
                  {getInitials(t.name)}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white/90">{t.name}</p>
                  <p className="text-[12px] text-white/40 mt-0.5">{t.subject}</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(t)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onClick={() => handleDelete(t.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>
            <div className="border-t border-white/[0.05] pt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-white/35">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span className="text-[12px]">{t.classes} classes</span>
              </div>
              {t.phone && (
                <div className="flex items-center gap-1.5 text-white/35">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.3a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.48h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z"/></svg>
                  <span className="text-[12px]">{t.phone}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {teachers.length === 0 && (
          <div className="col-span-3 flex items-center justify-center h-40">
            <p className="text-[13px] text-white/25">No teachers found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#111318] border border-white/[0.08] rounded-2xl w-[400px] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h2 className="text-[14px] font-semibold text-white">{editId ? 'Edit Teacher' : 'Add Teacher'}</h2>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <InputField label="Full Name *" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Teacher name" />
              <InputField label="Subject *" value={form.subject} onChange={v => setForm({ ...form, subject: v })} placeholder="e.g. Mathematics" />
              <InputField label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="05xxxxxxxx" />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-[13px] text-white/50 border border-white/[0.08] rounded-xl">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-[13px] font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl transition-colors">
                {saving ? 'Saving...' : editId ? 'Save Changes' : 'Add Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
