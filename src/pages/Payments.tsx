import { useEffect, useState } from 'react'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/ui/Toast'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Modal } from '../components/ui/Modal'
import { SkeletonTable } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

interface Payment {
  id: number; totalAmount: number; paidAmount: number; remaining: number
  percentage: number; dueDate: string | null; date: string
  status: 'paid' | 'pending' | 'overdue' | 'partial'
  student: { id: number; name: string; course: string }
}
interface Student { id: number; name: string; course: string }
interface Summary { annualFee: number; total: number; paid: number; remaining: number; fullPaid: number; partial: number; pending: number; overdue: number }
interface Transaction { id: number; amount: number; note: string | null; date: string }

const avatarColors = ['from-violet-500 to-indigo-600','from-blue-500 to-cyan-600','from-emerald-500 to-teal-600','from-amber-400 to-orange-500','from-pink-500 to-rose-600']
function getInitials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }

const STATUS = {
  paid:    { dot: '#10b981', text: '#10b981', badge: 'badge-success', label: 'Paid'    },
  partial: { dot: '#60a5fa', text: '#60a5fa', badge: 'badge-info',    label: 'Partial' },
  pending: { dot: '#fbbf24', text: '#fbbf24', badge: 'badge-warning', label: 'Pending' },
  overdue: { dot: '#f87171', text: '#f87171', badge: 'badge-error',   label: 'Overdue' },
}
const FILTERS = ['all','paid','partial','pending','overdue'] as const

export default function Payments() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [payments,    setPayments]    = useState<Payment[]>([])
  const [summary,     setSummary]     = useState<Summary>({ annualFee:0,total:0,paid:0,remaining:0,fullPaid:0,partial:0,pending:0,overdue:0 })
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [filter,      setFilter]      = useState<typeof FILTERS[number]>('all')

  const [showModal,   setShowModal]   = useState(false)
  const [students,    setStudents]    = useState<Student[]>([])
  const [form,        setForm]        = useState({ studentId:'', paidAmount:'', dueDate:'', payDate:'' })
  const [saving,      setSaving]      = useState(false)
  const [formError,   setFormError]   = useState('')

  const [partialModal, setPartialModal]  = useState(false)
  const [selPayment,   setSelPayment]    = useState<Payment | null>(null)
  const [partialAmt,   setPartialAmt]    = useState('')
  const [partialDate,  setPartialDate]   = useState('')
  const [partialSaving,setPartialSaving] = useState(false)

  const [txModal,     setTxModal]     = useState(false)
  const [txPayment,   setTxPayment]   = useState<Payment | null>(null)
  const [transactions,setTransactions]= useState<Transaction[]>([])
  const [txLoading,   setTxLoading]   = useState(false)

  const [editFee,     setEditFee]     = useState(false)
  const [newFee,      setNewFee]      = useState('')
  const [feeSaving,   setFeeSaving]   = useState(false)

  const [deleteId,    setDeleteId]    = useState<number | null>(null)
  const [delLoading,  setDelLoading]  = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      setLoading(true); setError('')
      const [paymentsRes, summaryRes] = await Promise.all([api.get('/payments'), api.get('/payments/summary')])
      setPayments(paymentsRes.data.payments)
      setSummary(summaryRes.data.summary)
    } catch { setError('Failed to load payment data. Please refresh.') }
    finally    { setLoading(false) }
  }

  async function openTransactions(payment: Payment) {
    setTxPayment(payment); setTxModal(true); setTxLoading(true)
    try {
      const res = await api.get(`/payments/${payment.id}/transactions`)
      setTransactions(res.data.transactions)
    } catch { setTransactions([]) }
    finally   { setTxLoading(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDelLoading(true)
    try {
      await api.delete(`/payments/${deleteId}`)
      await fetchData()
      toast.success('Payment record deleted.')
    } catch { toast.error('Failed to delete payment.') }
    finally   { setDelLoading(false); setDeleteId(null) }
  }

  async function openModal() {
    if (!isAdmin) return
    setForm({ studentId:'', paidAmount:'', dueDate:'', payDate:'' }); setFormError(''); setShowModal(true)
    if (students.length === 0) {
      try { const res = await api.get('/students'); setStudents(res.data.students) }
      catch { setFormError('Unable to load students.') }
    }
  }

  async function handleAddPayment() {
    if (!isAdmin || !form.studentId || !form.paidAmount) { setFormError('Please choose a student and enter the paid amount.'); return }
    setSaving(true)
    try {
      await api.post('/payments', { studentId: Number(form.studentId), paidAmount: Number(form.paidAmount), dueDate: form.dueDate || null, payDate: form.payDate || null })
      setShowModal(false); await fetchData(); toast.success('Payment added!')
    } catch { setFormError('Unable to save.') }
    finally   { setSaving(false) }
  }

  async function handlePartialPay() {
    if (!isAdmin || !partialAmt || !selPayment) return
    setPartialSaving(true)
    try {
      await api.patch(`/payments/${selPayment.id}/pay`, { amount: Number(partialAmt), date: partialDate || null })
      setPartialModal(false); setPartialAmt(''); setPartialDate(''); await fetchData(); toast.success('Payment recorded!')
    } catch { toast.error('Failed to record payment.') }
    finally   { setPartialSaving(false) }
  }

  async function handleUpdateFee() {
    if (!isAdmin || !newFee) return
    setFeeSaving(true)
    try {
      await api.post('/settings', { key: 'annual_fee', value: newFee })
      setEditFee(false); await fetchData(); toast.success('Annual fee updated!')
    } catch { toast.error('Failed to update fee.') }
    finally   { setFeeSaving(false) }
  }

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter)
  const collectionRate = summary.total ? Math.round((summary.paid / summary.total) * 100) : 0

  const statCards = [
    { label: 'Total Fees',  value: `${summary.total.toLocaleString()} SAR`,    color: 'var(--text)' },
    { label: 'Collected',   value: `${summary.paid.toLocaleString()} SAR`,     color: '#10b981', sub: `${collectionRate}% rate` },
    { label: 'Remaining',   value: `${summary.remaining.toLocaleString()} SAR`,color: '#f87171' },
    { label: 'Partial',     value: `${summary.partial} students`,              color: '#60a5fa' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Payment"
        message="Are you sure you want to delete this payment record?"
        confirmLabel={delLoading ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* Transactions Modal */}
      <Modal
        open={txModal && !!txPayment}
        onClose={() => setTxModal(false)}
        title={txPayment?.student.name ?? 'Transactions'}
        subtitle={txPayment?.student.course}
        maxWidth={480}
        footer={<button onClick={() => setTxModal(false)} className="w-full py-2.5 text-[13px] btn-ghost rounded-xl">Close</button>}
      >
        {txPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[ { label:'Total', value:txPayment.totalAmount.toLocaleString(), color:'var(--text)' },
                 { label:'Paid',  value:txPayment.paidAmount.toLocaleString(),  color:'#10b981' },
                 { label:'Left',  value:txPayment.remaining.toLocaleString(),   color: txPayment.remaining > 0 ? '#f87171' : '#10b981' },
              ].map(s => (
                <div key={s.label} className="rounded-xl px-3 py-3 text-center" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)' }}>
                  <p className="text-[11px] mb-1" style={{ color:'var(--text-muted)' }}>{s.label}</p>
                  <p className="text-[16px] font-bold" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] font-bold" style={{ color:'var(--text-muted)' }}>Payment History</p>
            {txLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <EmptyState title="No transactions" message="No payments recorded yet." />
            ) : (
              <div className="space-y-2">
                {transactions.map((tx, i) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background:'rgba(16,185,129,0.15)', color:'#10b981' }}>{i+1}</div>
                      <div>
                        <p className="text-[13px] font-bold" style={{ color:'#10b981' }}>+{tx.amount.toLocaleString()} SAR</p>
                        {tx.note && <p className="text-[11px]" style={{ color:'var(--text-muted)' }}>{tx.note}</p>}
                      </div>
                    </div>
                    <p className="text-[11px]" style={{ color:'var(--text-faint)' }}>
                      {new Date(tx.date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        open={showModal && isAdmin}
        onClose={() => setShowModal(false)}
        title="Add New Payment"
        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
        footer={
          <div className="flex gap-2.5">
            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-[13px] btn-ghost rounded-xl">Cancel</button>
            <button onClick={handleAddPayment} disabled={saving} className="flex-1 py-2.5 text-[13px] btn-primary rounded-xl">{saving ? 'Saving...' : 'Add'}</button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {formError && (
            <div className="rounded-xl px-4 py-2.5" style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)' }}>
              <p className="text-[12px]" style={{ color:'#f87171' }}>{formError}</p>
            </div>
          )}
          <div className="rounded-xl px-4 py-3" style={{ background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.15)' }}>
            <p className="text-[12px]" style={{ color:'#a78bfa' }}>Annual fee: <strong>{summary.annualFee.toLocaleString()} SAR</strong></p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold" style={{ color:'var(--text-muted)' }}>Student</label>
            <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className="input">
              <option value="" disabled>Choose a student...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.course}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold" style={{ color:'var(--text-muted)' }}>Paid Amount (SAR)</label>
            <input type="number" value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: e.target.value })} placeholder="0" className="input" />
            {form.paidAmount && <p className="text-[11px]" style={{ color:'var(--text-muted)' }}>Remaining: {(summary.annualFee - Number(form.paidAmount)).toLocaleString()} SAR</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color:'var(--text-muted)' }}>Payment Date</label>
              <input type="date" value={form.payDate} onChange={e => setForm({ ...form, payDate: e.target.value })} className="input" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color:'var(--text-muted)' }}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="input" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Partial Payment Modal */}
      <Modal
        open={partialModal && !!selPayment && isAdmin}
        onClose={() => setPartialModal(false)}
        title="Record Payment"
        maxWidth={400}
        footer={
          <div className="flex gap-2.5">
            <button onClick={() => setPartialModal(false)} className="flex-1 py-2.5 text-[13px] btn-ghost rounded-xl">Cancel</button>
            <button onClick={handlePartialPay} disabled={partialSaving || !partialAmt} className="flex-1 py-2.5 text-[13px] btn-primary rounded-xl">{partialSaving ? 'Saving...' : 'Confirm'}</button>
          </div>
        }
      >
        {selPayment && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl p-4" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)' }}>
              <p className="text-[13px] font-bold" style={{ color:'var(--text)' }}>{selPayment.student.name}</p>
              <p className="text-[12px] mt-1" style={{ color:'var(--text-muted)' }}>
                Remaining: <span style={{ color:'#f87171', fontWeight:700 }}>{selPayment.remaining.toLocaleString()} SAR</span>
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color:'var(--text-muted)' }}>Amount (SAR)</label>
              <input type="number" value={partialAmt} onChange={e => setPartialAmt(e.target.value)} placeholder="0" max={selPayment.remaining} className="input" />
              {partialAmt && Number(partialAmt) >= selPayment.remaining && (
                <p className="text-[11px] font-semibold" style={{ color:'#10b981' }}>This will complete the payment ✓</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color:'var(--text-muted)' }}>Date (Optional)</label>
              <input type="date" value={partialDate} onChange={e => setPartialDate(e.target.value)} className="input" />
            </div>
          </div>
        )}
      </Modal>

      {/* Error */}
      {error && (
        <div className="card px-5 py-4">
          <EmptyState title="Failed to load" message={error} action={{ label:'Retry', onClick: fetchData }} />
        </div>
      )}

      {/* Annual fee card */}
      <div className="card px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color:'var(--text-faint)' }}>Annual Fee</p>
          {editFee ? (
            <div className="flex items-center gap-2">
              <input type="number" value={newFee} onChange={e => setNewFee(e.target.value)} placeholder={String(summary.annualFee)}
                className="input" style={{ width:150 }} />
              <span className="text-[13px]" style={{ color:'var(--text-muted)' }}>SAR</span>
              <button onClick={handleUpdateFee} disabled={feeSaving} className="btn-primary px-3 py-1.5 text-[12px]" style={{ borderRadius:8 }}>{feeSaving ? '...' : 'Save'}</button>
              <button onClick={() => setEditFee(false)} className="btn-ghost px-3 py-1.5 text-[12px]" style={{ borderRadius:8 }}>Cancel</button>
            </div>
          ) : (
            <p className="text-[24px] font-extrabold" style={{ color:'var(--text)' }}>
              {summary.annualFee.toLocaleString()} <span className="text-[14px] font-normal" style={{ color:'var(--text-muted)' }}>SAR</span>
            </p>
          )}
        </div>
        {isAdmin && !editFee && (
          <button onClick={() => { setEditFee(true); setNewFee(String(summary.annualFee)) }}
            className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ color:'#a78bfa', background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)' }}
            onMouseEnter={e => (e.currentTarget.style.background='rgba(124,58,237,0.18)')}
            onMouseLeave={e => (e.currentTarget.style.background='rgba(124,58,237,0.1)')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 stagger">
        {statCards.map(item => (
          <div key={item.label} className="card px-5 py-4 animate-slide-up">
            <p className="text-[11px] font-semibold mb-1" style={{ color:'var(--text-faint)' }}>{item.label}</p>
            <p className="text-[20px] font-extrabold leading-none" style={{ color: item.color }}>{item.value}</p>
            {item.sub && <p className="text-[11px] mt-1" style={{ color:'#10b981' }}>{item.sub}</p>}
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="card px-5 py-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[13px] font-semibold" style={{ color:'var(--text)' }}>Collection Rate</span>
          <span className="text-[13px] font-bold" style={{ color: collectionRate >= 70 ? '#10b981' : '#fbbf24' }}>{collectionRate}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.05)' }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width:`${collectionRate}%`, background:'linear-gradient(90deg,#7c3aed,#10b981)' }} />
        </div>
      </div>

      {/* Filters + Add */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map(f => {
            const count = f === 'all' ? payments.length : payments.filter(p => p.status === f).length
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all capitalize"
                style={{
                  background: filter === f ? 'rgba(124,58,237,0.15)' : 'var(--surface)',
                  color:      filter === f ? '#a78bfa'               : 'var(--text-muted)',
                  border:     `1px solid ${filter === f ? 'rgba(124,58,237,0.3)' : 'var(--border)'}`,
                }}>
                {f === 'all' ? `All (${count})` : `${STATUS[f].label} (${count})`}
              </button>
            )
          })}
        </div>
        {isAdmin && (
          <button onClick={openModal} className="btn-primary flex items-center gap-2 px-4 py-2 text-[13px]" style={{ borderRadius:12 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Payment
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border)' }}>
              {['Student','Total','Paid','Remaining','Status',''].map((h,i) => (
                <th key={i} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color:'var(--text-faint)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={5} cols={6} />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}><EmptyState title="No payments found" message="Try a different filter." /></td></tr>
            ) : (
              filtered.map((p, i) => {
                const s = STATUS[p.status]
                return (
                  <tr key={p.id} className="transition-colors cursor-pointer" style={{ borderBottom:'1px solid var(--border)' }}
                    onClick={() => openTransactions(p)}
                    onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.025)')}
                    onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                          {getInitials(p.student.name)}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold" style={{ color:'#a78bfa' }}>{p.student.name}</p>
                          <p className="text-[11px]" style={{ color:'var(--text-faint)' }}>{p.student.course}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px]" style={{ color:'var(--text-muted)' }}>
                      {p.totalAmount.toLocaleString()} <span className="text-[11px]" style={{ color:'var(--text-faint)' }}>SAR</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-semibold" style={{ color:'var(--text)' }}>{p.paidAmount.toLocaleString()} SAR</p>
                      <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ width:80, background:'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width:`${p.percentage}%`, background:'#10b981' }} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-semibold" style={{ color: p.remaining > 0 ? '#f87171' : '#10b981' }}>
                        {p.remaining.toLocaleString()} SAR
                      </p>
                      {p.dueDate && <p className="text-[10px] mt-0.5" style={{ color:'var(--text-faint)' }}>Due: {new Date(p.dueDate).toLocaleDateString('en-GB')}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${s.badge}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {isAdmin && (
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          {p.status !== 'paid' && (
                            <button
                              onClick={() => { setSelPayment(p); setPartialAmt(''); setPartialDate(''); setPartialModal(true) }}
                              className="text-[11px] px-3 py-1 rounded-lg transition-colors font-medium"
                              style={{ border:'1px solid var(--border)', color:'var(--text-muted)' }}
                              onMouseEnter={e => { e.currentTarget.style.color='#a78bfa'; e.currentTarget.style.borderColor='rgba(124,58,237,0.3)' }}
                              onMouseLeave={e => { e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.borderColor='var(--border)' }}>
                              + Pay
                            </button>
                          )}
                          <button onClick={() => setDeleteId(p.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ color:'var(--text-faint)' }}
                            onMouseEnter={e => { e.currentTarget.style.color='#f87171'; e.currentTarget.style.background='rgba(248,113,113,0.1)' }}
                            onMouseLeave={e => { e.currentTarget.style.color='var(--text-faint)'; e.currentTarget.style.background='transparent' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
