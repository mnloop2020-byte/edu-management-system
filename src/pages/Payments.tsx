import { useState, useEffect } from 'react'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'

interface Payment {
  id: number
  totalAmount: number
  paidAmount: number
  remaining: number
  percentage: number
  dueDate: string | null
  date: string
  status: 'paid' | 'pending' | 'overdue' | 'partial'
  student: { id: number; name: string; course: string }
}

interface Student {
  id: number
  name: string
  course: string
}

interface Summary {
  annualFee: number
  total: number
  paid: number
  remaining: number
  fullPaid: number
  partial: number
  pending: number
  overdue: number
}

const avatarColors = [
  'from-violet-500 to-indigo-600', 'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600', 'from-amber-400 to-orange-500',
  'from-pink-500 to-rose-600',
]

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function statusBadge(status: string) {
  switch (status) {
    case 'paid':    return { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Paid' }
    case 'partial': return { dot: 'bg-blue-400',    text: 'text-blue-400',    label: 'Partial' }
    case 'pending': return { dot: 'bg-amber-400',   text: 'text-amber-400',   label: 'Pending' }
    case 'overdue': return { dot: 'bg-red-400',     text: 'text-red-400',     label: 'Overdue' }
    default:        return { dot: 'bg-white/30',    text: 'text-white/50',    label: status }
  }
}

export default function Payments() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<Summary>({ annualFee: 0, total: 0, paid: 0, remaining: 0, fullPaid: 0, partial: 0, pending: 0, overdue: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'paid' | 'partial' | 'pending' | 'overdue'>('all')

  // Add Payment Modal
  const [showModal, setShowModal] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [form, setForm] = useState({ studentId: '', paidAmount: '', dueDate: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Partial Payment Modal
  const [partialModal, setPartialModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [partialAmount, setPartialAmount] = useState('')
  const [partialSaving, setPartialSaving] = useState(false)

  // Edit Annual Fee
  const [editFee, setEditFee] = useState(false)
  const [newFee, setNewFee] = useState('')
  const [feeSaving, setFeeSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [paymentsRes, summaryRes] = await Promise.all([
        api.get('/payments'),
        api.get('/payments/summary'),
      ])
      setPayments(paymentsRes.data.payments)
      setSummary(summaryRes.data.summary)
    } finally {
      setLoading(false)
    }
  }

  async function openModal() {
    setForm({ studentId: '', paidAmount: '', dueDate: '' })
    setFormError('')
    setShowModal(true)
    if (students.length === 0) {
      const res = await api.get('/students')
      setStudents(res.data.students)
    }
  }

  async function handleAddPayment() {
    if (!form.studentId || !form.paidAmount) {
      setFormError('يرجى تحديد الطالب والمبلغ المدفوع')
      return
    }
    setSaving(true)
    try {
      await api.post('/payments', {
        studentId: Number(form.studentId),
        paidAmount: Number(form.paidAmount),
        dueDate: form.dueDate || null,
      })
      setShowModal(false)
      fetchData()
    } catch {
      setFormError('حدث خطأ، حاول مجدداً')
    } finally {
      setSaving(false)
    }
  }

  async function handlePartialPay() {
    if (!partialAmount || !selectedPayment) return
    setPartialSaving(true)
    try {
      await api.patch(`/payments/${selectedPayment.id}/pay`, { amount: Number(partialAmount) })
      setPartialModal(false)
      setPartialAmount('')
      fetchData()
    } catch {
      alert('فشل في إضافة الدفع')
    } finally {
      setPartialSaving(false)
    }
  }

  async function handleUpdateFee() {
    if (!newFee) return
    setFeeSaving(true)
    try {
      await api.post('/settings', { key: 'annual_fee', value: newFee })
      setEditFee(false)
      fetchData()
    } catch {
      alert('فشل في تحديث الرسوم')
    } finally {
      setFeeSaving(false)
    }
  }

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter)
  const collectionRate = summary.total ? Math.round((summary.paid / summary.total) * 100) : 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin text-violet-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* Annual Fee Banner */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-white/35 mb-1">الرسوم السنوية</p>
          {editFee ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={newFee}
                onChange={e => setNewFee(e.target.value)}
                placeholder={String(summary.annualFee)}
                className="bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-1.5 text-[14px] text-white/80 outline-none focus:border-violet-500/50 w-36"
              />
              <span className="text-[13px] text-white/40">ريال</span>
              <button onClick={handleUpdateFee} disabled={feeSaving}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[12px] rounded-lg disabled:opacity-50 transition-colors">
                {feeSaving ? '...' : 'حفظ'}
              </button>
              <button onClick={() => setEditFee(false)} className="px-3 py-1.5 border border-white/[0.08] text-white/40 text-[12px] rounded-lg">
                إلغاء
              </button>
            </div>
          ) : (
            <p className="text-[22px] font-bold text-white">
              {summary.annualFee.toLocaleString()} <span className="text-[14px] font-normal text-white/40">ريال</span>
            </p>
          )}
        </div>
        {isAdmin && !editFee && (
          <button onClick={() => { setEditFee(true); setNewFee(String(summary.annualFee)) }}
            className="flex items-center gap-1.5 text-[12px] text-violet-400 hover:text-violet-300 border border-violet-500/20 hover:border-violet-500/40 px-3 py-1.5 rounded-lg transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            تعديل
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'إجمالي الرسوم', value: `${summary.total.toLocaleString()}`, sub: 'ريال', color: 'text-white' },
          { label: 'المحصّل',        value: `${summary.paid.toLocaleString()}`,  sub: `${collectionRate}%`, color: 'text-emerald-400' },
          { label: 'المتبقي',        value: `${summary.remaining.toLocaleString()}`, sub: 'ريال', color: 'text-red-400' },
          { label: 'دفع جزئي',      value: summary.partial, sub: 'طلاب', color: 'text-blue-400' },
        ].map(item => (
          <div key={item.label} className="bg-[#111318] border border-white/[0.06] rounded-2xl px-5 py-4">
            <p className="text-[11px] text-white/35 mb-1">{item.label}</p>
            <p className={`text-[22px] font-bold ${item.color}`}>{item.value}</p>
            <p className="text-[11px] text-white/30 mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[12px] text-white/40">نسبة التحصيل</span>
          <span className="text-[12px] font-semibold text-white/60">{collectionRate}%</span>
        </div>
        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${collectionRate}%` }} />
        </div>
      </div>

      {/* Filter + Add */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'paid', 'partial', 'pending', 'overdue'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all capitalize ${
                filter === f
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                  : 'text-white/35 hover:text-white/65 border border-white/[0.06]'
              }`}>
              {f === 'all' ? `الكل (${payments.length})` : `${statusBadge(f).label} (${payments.filter(p => p.status === f).length})`}
            </button>
          ))}
        </div>
        <button onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium rounded-xl transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          إضافة دفعة
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {['الطالب', 'الرسوم الكاملة', 'المدفوع', 'المتبقي', 'الحالة', ''].map((h, i) => (
                <th key={i} className="px-5 py-3 text-right text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const badge = statusBadge(p.status)
              return (
                <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                        {getInitials(p.student.name)}
                      </div>
                      <div>
                        <p className="text-[13px] text-white/85 font-medium">{p.student.name}</p>
                        <p className="text-[11px] text-white/30">{p.student.course}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-[13px] text-white/60">{p.totalAmount.toLocaleString()}</span>
                    <span className="text-[11px] text-white/25 ml-1">ريال</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div>
                      <span className="text-[13px] font-semibold text-white/80">{p.paidAmount.toLocaleString()}</span>
                      <span className="text-[11px] text-white/25 ml-1">ريال</span>
                      <div className="h-1 bg-white/[0.04] rounded-full mt-1 w-20 ml-auto">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${p.percentage}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`text-[13px] font-semibold ${p.remaining > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {p.remaining.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-white/25 ml-1">ريال</span>
                    {p.dueDate && (
                      <p className="text-[10px] text-white/25 mt-0.5">
                        استحقاق: {new Date(p.dueDate).toLocaleDateString('ar-SA')}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      <span className={`text-[12px] font-medium ${badge.text}`}>{badge.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {p.status !== 'paid' && (
                      <button
                        onClick={() => { setSelectedPayment(p); setPartialAmount(''); setPartialModal(true) }}
                        className="text-[11px] px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/40 hover:text-violet-400 hover:border-violet-500/30 transition-colors">
                        إضافة دفع
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-[13px] text-white/25">لا توجد دفعات</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-semibold text-white">إضافة دفعة جديدة</h2>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                <p className="text-[12px] text-red-400">{formError}</p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
                <p className="text-[12px] text-violet-300">
                  الرسوم السنوية: <span className="font-bold">{summary.annualFee.toLocaleString()} ريال</span>
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-white/40">الطالب</label>
                <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white/80 outline-none focus:border-violet-500/50">
                  <option value="" disabled className="bg-[#111318]">اختر طالباً...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#111318]">{s.name} — {s.course}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-white/40">المبلغ المدفوع (ريال)</label>
                <input type="number" value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: e.target.value })}
                  placeholder="0"
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white/80 outline-none focus:border-violet-500/50" />
                {form.paidAmount && (
                  <p className="text-[11px] text-white/30">
                    المتبقي: {(summary.annualFee - Number(form.paidAmount)).toLocaleString()} ريال
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-white/40">تاريخ استحقاق الباقي (اختياري)</label>
                <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white/80 outline-none focus:border-violet-500/50" />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-[13px] text-white/40 hover:text-white/60 transition-colors">
                إلغاء
              </button>
              <button onClick={handleAddPayment} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-[13px] font-medium text-white transition-colors">
                {saving ? 'جاري الحفظ...' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partial Payment Modal */}
      {partialModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-semibold text-white">إضافة دفع</h2>
              <button onClick={() => setPartialModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="bg-white/[0.03] rounded-xl p-4 mb-4">
              <p className="text-[13px] font-medium text-white/80">{selectedPayment.student.name}</p>
              <p className="text-[11px] text-white/35 mt-1">
                المتبقي: <span className="text-red-400 font-semibold">{selectedPayment.remaining.toLocaleString()} ريال</span>
              </p>
            </div>

            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-[11px] font-medium text-white/40">المبلغ المدفوع الآن (ريال)</label>
              <input type="number" value={partialAmount} onChange={e => setPartialAmount(e.target.value)}
                placeholder="0" max={selectedPayment.remaining}
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white/80 outline-none focus:border-violet-500/50" />
              {partialAmount && Number(partialAmount) >= selectedPayment.remaining && (
                <p className="text-[11px] text-emerald-400">✓ سيتم تسجيل الدفع كاملاً</p>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setPartialModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-[13px] text-white/40 hover:text-white/60 transition-colors">
                إلغاء
              </button>
              <button onClick={handlePartialPay} disabled={partialSaving}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-[13px] font-medium text-white transition-colors">
                {partialSaving ? 'جاري...' : 'تأكيد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}