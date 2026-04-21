import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../hooks/useLocale'
import { toast } from '../components/ui/Toast'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Modal } from '../components/ui/Modal'
import { SkeletonTable } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

interface Installment { id: number; amount: number; paidAmount: number; dueDate: string; status: 'paid' | 'pending' | 'overdue' }
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
  installments: Installment[]
}
interface Student { id: number; name: string; course: string }
interface Summary { annualFee: number; total: number; paid: number; remaining: number; fullPaid: number; partial: number; pending: number; overdue: number }
interface Transaction { id: number; amount: number; note: string | null; date: string }

const FILTERS = ['all', 'paid', 'partial', 'pending', 'overdue'] as const

function getCopy(locale: 'ar' | 'en') {
  return locale === 'ar'
    ? {
        status: {
          paid: 'مدفوع',
          partial: 'جزئي',
          pending: 'معلق',
          overdue: 'متأخر',
        },
        errorLoad: 'فشل تحميل بيانات المدفوعات',
        createSuccess: 'تمت إضافة الدفعة',
        createError: 'فشل إضافة الدفعة',
        recordSuccess: 'تم تسجيل الدفعة',
        recordError: 'فشل تسجيل الدفعة',
        installmentsEmpty: 'أضف قسطًا واحدًا على الأقل',
        installmentsSuccess: 'تم تحديث الأقساط',
        installmentsError: 'فشل تحديث الأقساط',
        deleteSuccess: 'تم حذف سجل الدفعة',
        deleteError: 'فشل حذف سجل الدفعة',
        deleteTitle: 'حذف دفعة',
        deleteMessage: 'هل تريد حذف سجل الدفعة هذا؟',
        delete: 'حذف',
        addPayment: 'إضافة دفعة',
        cancel: 'إلغاء',
        save: 'حفظ',
        saving: 'جارٍ الحفظ...',
        chooseStudent: 'اختر الطالب',
        paidAmount: 'المبلغ المدفوع',
        recordPayment: 'تسجيل دفعة',
        confirm: 'تأكيد',
        amount: 'المبلغ',
        installments: 'الأقساط',
        remove: 'إزالة',
        addInstallment: 'إضافة قسط',
        paymentHistory: 'سجل الدفعات',
        close: 'إغلاق',
        installmentPlan: 'خطة الأقساط',
        noTransactions: 'لا توجد حركات',
        noTransactionsMessage: 'لم يتم تسجيل أي حركة لهذه الدفعة.',
        revenueDesk: 'مركز التحصيل',
        title: 'تابع المدفوعات قبل أن تصبح متأخرة.',
        subtitle: 'راقب التحصيل والأرصدة المستحقة وخطط الأقساط من مساحة عمل واحدة.',
        failedToLoad: 'فشل التحميل',
        retry: 'إعادة المحاولة',
        overdueFollowUp: 'متابعة المتأخرات',
        overdueCount: 'سجلات تحتاج إلى إجراء',
        annualFee: 'الرسوم السنوية',
        collected: 'المحصّل',
        remaining: 'المتبقي',
        collectionRate: 'نسبة التحصيل',
        all: 'الكل',
        student: 'الطالب',
        progress: 'التقدم',
        dueDate: 'الاستحقاق',
        statusLabel: 'الحالة',
        history: 'السجل',
        pay: 'دفع',
        plan: 'خطة',
        noPaymentRecords: 'لا توجد سجلات مدفوعات',
        noPaymentRecordsMessage: 'جرّب فلترًا آخر أو أضف دفعة جديدة.',
        installmentsCount: 'أقساط',
        currency: 'ر.س',
      }
    : {
        status: {
          paid: 'Paid',
          partial: 'Partial',
          pending: 'Pending',
          overdue: 'Overdue',
        },
        errorLoad: 'Failed to load payment data',
        createSuccess: 'Payment created',
        createError: 'Failed to create payment',
        recordSuccess: 'Payment recorded',
        recordError: 'Failed to record payment',
        installmentsEmpty: 'Add at least one installment',
        installmentsSuccess: 'Installments updated',
        installmentsError: 'Failed to update installments',
        deleteSuccess: 'Payment deleted',
        deleteError: 'Failed to delete payment',
        deleteTitle: 'Delete Payment',
        deleteMessage: 'Are you sure you want to delete this payment record?',
        delete: 'Delete',
        addPayment: 'Add Payment',
        cancel: 'Cancel',
        save: 'Save',
        saving: 'Saving...',
        chooseStudent: 'Choose student',
        paidAmount: 'Paid amount',
        recordPayment: 'Record Payment',
        confirm: 'Confirm',
        amount: 'Amount',
        installments: 'Installments',
        remove: 'Remove',
        addInstallment: 'Add Installment',
        paymentHistory: 'Payment History',
        close: 'Close',
        installmentPlan: 'Installment plan',
        noTransactions: 'No transactions',
        noTransactionsMessage: 'No transactions have been recorded for this payment.',
        revenueDesk: 'Revenue Desk',
        title: 'Track payments before they turn overdue.',
        subtitle: 'Keep collection health, outstanding balances, and installment plans visible in one payment workspace.',
        failedToLoad: 'Failed to load',
        retry: 'Retry',
        overdueFollowUp: 'Overdue Follow-up',
        overdueCount: 'payment records need action',
        annualFee: 'Annual Fee',
        collected: 'Collected',
        remaining: 'Remaining',
        collectionRate: 'Collection Rate',
        all: 'All',
        student: 'Student',
        progress: 'Progress',
        dueDate: 'Due Date',
        statusLabel: 'Status',
        history: 'History',
        pay: 'Pay',
        plan: 'Plan',
        noPaymentRecords: 'No payment records',
        noPaymentRecordsMessage: 'Try another filter or add a new payment.',
        installmentsCount: 'installments',
        currency: 'SAR',
      }
}

export default function Payments() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const copy = useMemo(() => getCopy(locale), [locale])
  const [searchParams] = useSearchParams()
  const isAdmin = user?.role === 'ADMIN'
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<Summary>({ annualFee: 0, total: 0, paid: 0, remaining: 0, fullPaid: 0, partial: 0, pending: 0, overdue: 0 })
  const [reminders, setReminders] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showPartial, setShowPartial] = useState(false)
  const [showInstallments, setShowInstallments] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)
  const [selected, setSelected] = useState<Payment | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [form, setForm] = useState({ studentId: '', paidAmount: '', dueDate: '', payDate: '' })
  const [partialForm, setPartialForm] = useState({ amount: '', date: '' })
  const [installments, setInstallments] = useState<Array<{ amount: string; dueDate: string }>>([{ amount: '', dueDate: '' }])
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const statusMeta = {
    paid: { label: copy.status.paid, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    partial: { label: copy.status.partial, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
    pending: { label: copy.status.pending, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    overdue: { label: copy.status.overdue, color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  }

  useEffect(() => {
    const status = searchParams.get('status') as typeof FILTERS[number] | null
    setFilter(status && FILTERS.includes(status) ? status : 'all')
  }, [searchParams])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [paymentsRes, summaryRes, overdueRes] = await Promise.all([api.get('/payments'), api.get('/payments/summary'), api.get('/payments/overdue')])
      setPayments(paymentsRes.data.payments)
      setSummary(summaryRes.data.summary)
      setReminders(overdueRes.data.reminders ?? [])
    } catch {
      setError(copy.errorLoad)
    } finally {
      setLoading(false)
    }
  }, [copy.errorLoad])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  async function openCreate() {
    setShowCreate(true)
    if (students.length === 0) {
      const res = await api.get('/students')
      setStudents(res.data.students)
    }
  }

  async function createPayment() {
    if (!form.studentId || !form.paidAmount) return
    setSaving(true)
    try {
      await api.post('/payments', { studentId: Number(form.studentId), paidAmount: Number(form.paidAmount), dueDate: form.dueDate || null, payDate: form.payDate || null })
      setShowCreate(false)
      setForm({ studentId: '', paidAmount: '', dueDate: '', payDate: '' })
      await fetchData()
      toast.success(copy.createSuccess)
    } catch {
      toast.error(copy.createError)
    } finally {
      setSaving(false)
    }
  }

  async function recordPayment() {
    if (!selected || !partialForm.amount) return
    setSaving(true)
    try {
      await api.patch(`/payments/${selected.id}/pay`, { amount: Number(partialForm.amount), date: partialForm.date || null })
      setShowPartial(false)
      setPartialForm({ amount: '', date: '' })
      await fetchData()
      toast.success(copy.recordSuccess)
    } catch {
      toast.error(copy.recordError)
    } finally {
      setSaving(false)
    }
  }

  async function saveInstallments() {
    if (!selected) return
    const payload = installments.map(item => ({ amount: Number(item.amount), dueDate: item.dueDate })).filter(item => item.amount > 0 && item.dueDate)
    if (payload.length === 0) {
      toast.error(copy.installmentsEmpty)
      return
    }
    setSaving(true)
    try {
      await api.post(`/payments/${selected.id}/installments`, { installments: payload })
      setShowInstallments(false)
      await fetchData()
      toast.success(copy.installmentsSuccess)
    } catch {
      toast.error(copy.installmentsError)
    } finally {
      setSaving(false)
    }
  }

  async function openTransactions(payment: Payment) {
    setSelected(payment)
    setShowTransactions(true)
    const res = await api.get(`/payments/${payment.id}/transactions`)
    setTransactions(res.data.transactions)
  }

  async function deletePayment() {
    if (!deleteId) return
    try {
      await api.delete(`/payments/${deleteId}`)
      setDeleteId(null)
      await fetchData()
      toast.success(copy.deleteSuccess)
    } catch {
      toast.error(copy.deleteError)
    }
  }

  const highlightedStudentId = Number(searchParams.get('studentId') || 0)
  const filtered = useMemo(
    () => (filter === 'all' ? payments : payments.filter(payment => payment.status === filter)).sort((a, b) => {
      if (a.student.id === highlightedStudentId) return -1
      if (b.student.id === highlightedStudentId) return 1
      return a.student.name.localeCompare(b.student.name)
    }),
    [payments, filter, highlightedStudentId]
  )

  const collectionRate = summary.total ? Math.round((summary.paid / summary.total) * 100) : 0
  const dateLocale = locale === 'ar' ? 'ar' : 'en-GB'

  return (
    <div className="space-y-5 animate-fade-in">
      <ConfirmDialog open={deleteId !== null} title={copy.deleteTitle} message={copy.deleteMessage} confirmLabel={copy.delete} onConfirm={deletePayment} onCancel={() => setDeleteId(null)} />

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={copy.addPayment}
        footer={<div className="flex gap-2.5"><button onClick={() => setShowCreate(false)} className="btn-ghost flex-1 py-2.5 text-[13px] rounded-xl">{copy.cancel}</button><button onClick={createPayment} disabled={saving} className="btn-primary flex-1 py-2.5 text-[13px] rounded-xl">{saving ? copy.saving : copy.save}</button></div>}
      >
        <div className="space-y-4">
          <select className="input" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
            <option value="">{copy.chooseStudent}</option>
            {students.map(student => <option key={student.id} value={student.id}>{student.name} - {student.course}</option>)}
          </select>
          <input className="input" type="number" placeholder={copy.paidAmount} value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input" type="date" value={form.payDate} onChange={e => setForm({ ...form, payDate: e.target.value })} />
            <input className="input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
        </div>
      </Modal>

      <Modal
        open={showPartial && !!selected}
        onClose={() => setShowPartial(false)}
        title={selected ? `${copy.recordPayment} · ${selected.student.name}` : copy.recordPayment}
        footer={<div className="flex gap-2.5"><button onClick={() => setShowPartial(false)} className="btn-ghost flex-1 py-2.5 text-[13px] rounded-xl">{copy.cancel}</button><button onClick={recordPayment} disabled={saving} className="btn-primary flex-1 py-2.5 text-[13px] rounded-xl">{saving ? copy.saving : copy.confirm}</button></div>}
      >
        <div className="space-y-4">
          <input className="input" type="number" placeholder={copy.amount} value={partialForm.amount} onChange={e => setPartialForm({ ...partialForm, amount: e.target.value })} />
          <input className="input" type="date" value={partialForm.date} onChange={e => setPartialForm({ ...partialForm, date: e.target.value })} />
        </div>
      </Modal>

      <Modal
        open={showInstallments && !!selected}
        onClose={() => setShowInstallments(false)}
        title={selected ? `${copy.installments} · ${selected.student.name}` : copy.installments}
        footer={<div className="flex gap-2.5"><button onClick={() => setShowInstallments(false)} className="btn-ghost flex-1 py-2.5 text-[13px] rounded-xl">{copy.cancel}</button><button onClick={saveInstallments} disabled={saving} className="btn-primary flex-1 py-2.5 text-[13px] rounded-xl">{saving ? copy.saving : copy.save}</button></div>}
      >
        <div className="space-y-3">
          {installments.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input className="input" type="number" placeholder={copy.amount} value={item.amount} onChange={e => setInstallments(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, amount: e.target.value } : row))} />
              <input className="input" type="date" value={item.dueDate} onChange={e => setInstallments(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, dueDate: e.target.value } : row))} />
              <button onClick={() => setInstallments(current => current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index))} className="btn-ghost px-3 py-2 text-[12px]">{copy.remove}</button>
            </div>
          ))}
          <button onClick={() => setInstallments(current => [...current, { amount: '', dueDate: '' }])} className="btn-ghost w-full py-2 text-[12px]">{copy.addInstallment}</button>
        </div>
      </Modal>

      <Modal
        open={showTransactions && !!selected}
        onClose={() => setShowTransactions(false)}
        title={selected?.student.name || copy.paymentHistory}
        footer={<button onClick={() => setShowTransactions(false)} className="btn-ghost w-full py-2.5 text-[13px] rounded-xl">{copy.close}</button>}
      >
        <div className="space-y-3">
          {selected?.installments.length ? (
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
              <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>{copy.installmentPlan}</p>
              <div className="space-y-2">
                {selected.installments.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between text-[12px]">
                    <span style={{ color: 'var(--text)' }}>#{index + 1} · {item.amount.toLocaleString()} {copy.currency}</span>
                    <span style={{ color: statusMeta[item.status].color }}>{new Date(item.dueDate).toLocaleDateString(dateLocale)} · {statusMeta[item.status].label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {transactions.length === 0 ? <EmptyState title={copy.noTransactions} message={copy.noTransactionsMessage} /> : transactions.map(item => (
            <div key={item.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: '#10b981' }}>+{item.amount.toLocaleString()} {copy.currency}</p>
                  {item.note && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{item.note}</p>}
                </div>
                <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{new Date(item.date).toLocaleDateString(dateLocale)}</span>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <section className="card p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(circle at top right, rgba(124,58,237,0.18), transparent 38%)' }} />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-faint)' }}>{copy.revenueDesk}</p>
            <h2 className="text-[26px] font-extrabold mt-2" style={{ color: 'var(--text)' }}>{copy.title}</h2>
            <p className="text-[13px] mt-3 max-w-[680px]" style={{ color: 'var(--text-muted)' }}>{copy.subtitle}</p>
          </div>
          {isAdmin && <button onClick={openCreate} className="btn-primary px-4 py-2.5 text-[13px]" style={{ borderRadius: 12 }}>{copy.addPayment}</button>}
        </div>
      </section>

      {error && <div className="card"><EmptyState title={copy.failedToLoad} message={error} action={{ label: copy.retry, onClick: fetchData }} /></div>}

      {reminders.length > 0 && (
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.overdueFollowUp}</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{reminders.length} {copy.overdueCount}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {reminders.slice(0, 4).map(item => <span key={item.id} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold" style={{ color: '#f87171', background: 'rgba(248,113,113,0.12)' }}>{item.student.name}</span>)}
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: copy.annualFee, value: `${summary.annualFee.toLocaleString()} ${copy.currency}`, color: '#a78bfa' },
          { label: copy.collected, value: `${summary.paid.toLocaleString()} ${copy.currency}`, color: '#10b981' },
          { label: copy.remaining, value: `${summary.remaining.toLocaleString()} ${copy.currency}`, color: '#f87171' },
          { label: copy.collectionRate, value: `${collectionRate}%`, color: collectionRate >= 70 ? '#10b981' : '#fbbf24' },
        ].map(item => (
          <div key={item.label} className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{item.label}</p>
            <p className="text-[24px] font-extrabold mt-2" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </section>

      <section className="card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map(item => (
            <button key={item} onClick={() => setFilter(item)} className="px-3 py-1.5 rounded-lg text-[12px] font-medium capitalize" style={{ background: filter === item ? 'rgba(124,58,237,0.16)' : 'transparent', color: filter === item ? '#a78bfa' : 'var(--text-muted)', border: `1px solid ${filter === item ? 'rgba(124,58,237,0.32)' : 'var(--border)'}` }}>
              {item === 'all' ? copy.all : statusMeta[item].label}
            </button>
          ))}
        </div>
      </section>

      <section className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[copy.student, copy.progress, copy.dueDate, copy.statusLabel, ''].map(header => <th key={header} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonTable rows={6} cols={5} /> : filtered.length === 0 ? <tr><td colSpan={5}><EmptyState title={copy.noPaymentRecords} message={copy.noPaymentRecordsMessage} /></td></tr> : filtered.map(payment => {
              const tone = statusMeta[payment.status]
              return (
                <tr
                  key={payment.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: payment.student.id === highlightedStudentId ? 'rgba(124,58,237,0.08)' : 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = payment.student.id === highlightedStudentId ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.025)')}
                  onMouseLeave={e => (e.currentTarget.style.background = payment.student.id === highlightedStudentId ? 'rgba(124,58,237,0.08)' : 'transparent')}
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{payment.student.name}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{payment.student.course}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 min-w-[220px]">
                    <div className="flex items-center justify-between text-[12px] mb-1.5">
                      <span style={{ color: 'var(--text)' }}>{payment.paidAmount.toLocaleString()} / {payment.totalAmount.toLocaleString()} {copy.currency}</span>
                      <span style={{ color: payment.remaining > 0 ? '#f87171' : '#10b981' }}>{payment.percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width: `${payment.percentage}%`, background: tone.color }} />
                    </div>
                    {payment.installments.length > 0 && <p className="text-[11px] mt-2" style={{ color: 'var(--text-faint)' }}>{payment.installments.length} {copy.installmentsCount}</p>}
                  </td>
                  <td className="px-5 py-4 text-[12px]" style={{ color: 'var(--text-muted)' }}>{payment.dueDate ? new Date(payment.dueDate).toLocaleDateString(dateLocale) : '-'}</td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ color: tone.color, background: tone.bg }}>{tone.label}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openTransactions(payment)} className="btn-ghost px-3 py-1.5 text-[11px]">{copy.history}</button>
                      {isAdmin && payment.status !== 'paid' && <button onClick={() => { setSelected(payment); setPartialForm({ amount: '', date: '' }); setShowPartial(true) }} className="btn-ghost px-3 py-1.5 text-[11px]">{copy.pay}</button>}
                      {isAdmin && <button onClick={() => { setSelected(payment); setInstallments(payment.installments.length ? payment.installments.map(item => ({ amount: String(item.amount), dueDate: item.dueDate.slice(0, 10) })) : [{ amount: '', dueDate: '' }]); setShowInstallments(true) }} className="btn-ghost px-3 py-1.5 text-[11px]">{copy.plan}</button>}
                      {isAdmin && <button onClick={() => setDeleteId(payment.id)} className="btn-ghost px-3 py-1.5 text-[11px]" style={{ color: '#f87171' }}>{copy.delete}</button>}
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
