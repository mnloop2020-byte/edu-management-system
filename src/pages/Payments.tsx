import { useState, useEffect } from 'react'
import api from '../api/api'

interface Payment {
  id: number
  amount: number
  date: string
  status: 'paid' | 'pending' | 'overdue'
  student: { id: number; name: string; course: string }
}

interface Summary { total: number; paid: number; pending: number; overdue: number }

type PayStatus = 'paid' | 'pending' | 'overdue'

const avatarColors = [
  'from-violet-500 to-indigo-600', 'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',  'from-amber-400 to-orange-500',
  'from-pink-500 to-rose-600',
]

const statusConfig: Record<PayStatus, { label: string; dot: string; text: string }> = {
  paid:    { label: 'Paid',    dot: 'bg-emerald-400', text: 'text-emerald-400' },
  pending: { label: 'Pending', dot: 'bg-amber-400',   text: 'text-amber-400' },
  overdue: { label: 'Overdue', dot: 'bg-red-400',     text: 'text-red-400' },
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<Summary>({ total: 0, paid: 0, pending: 0, overdue: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | PayStatus>('all')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

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

  async function markAsPaid(id: number) {
    setUpdatingId(id)
    try {
      await api.patch(`/payments/${id}/status`, { status: 'paid' })
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'paid' } : p))
      setSummary(prev => ({ ...prev, paid: prev.paid + 500, pending: prev.pending - 500 }))
    } catch {
      alert('Failed to update payment')
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter)
  const paidRate = summary.total ? Math.round((summary.paid / summary.total) * 100) : 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin text-violet-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Fees',   value: `${summary.total} SAR`,   sub: `${payments.length} students`,                                        color: 'text-white' },
          { label: 'Collected',    value: `${summary.paid} SAR`,    sub: `${paidRate}% of total`,                                              color: 'text-emerald-400' },
          { label: 'Outstanding',  value: `${summary.pending + summary.overdue} SAR`, sub: `${payments.filter(p => p.status !== 'paid').length} students`, color: 'text-red-400' },
        ].map(item => (
          <div key={item.label} className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-[12px] text-white/40 mb-2">{item.label}</p>
            <p className={`text-[26px] font-bold leading-none ${item.color}`}>{item.value}</p>
            <p className="text-[11px] text-white/30 mt-1.5">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[12px] text-white/40">Collection progress</span>
          <span className="text-[12px] font-semibold text-white/60">{paidRate}%</span>
        </div>
        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${paidRate}%` }} />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'paid', 'pending', 'overdue'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all capitalize ${
              filter === f
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                : 'text-white/35 hover:text-white/65 border border-white/[0.06] hover:border-white/[0.1]'
            }`}>
            {f === 'all'
              ? `All (${payments.length})`
              : `${statusConfig[f].label} (${payments.filter(p => p.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {['Student', 'Amount', 'Date', 'Status', ''].map((h, i) => (
                <th key={i} className="px-5 py-3 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
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
                <td className="px-5 py-3.5">
                  <span className="text-[14px] font-semibold text-white/80">{p.amount}</span>
                  <span className="text-[11px] text-white/30 ml-1">SAR</span>
                </td>
                <td className="px-5 py-3.5 text-[12px] text-white/35">
                  {new Date(p.date).toLocaleDateString('en-GB')}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[p.status].dot}`} />
                    <span className={`text-[12px] font-medium ${statusConfig[p.status].text}`}>{statusConfig[p.status].label}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  {p.status !== 'paid' && (
                    <button onClick={() => markAsPaid(p.id)} disabled={updatingId === p.id}
                      className="text-[11px] px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/40 hover:text-emerald-400 hover:border-emerald-500/30 disabled:opacity-50 transition-colors">
                      {updatingId === p.id ? 'Saving...' : 'Mark Paid'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-[13px] text-white/25">No payments found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
