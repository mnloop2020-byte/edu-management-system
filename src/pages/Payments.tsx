import { useState } from 'react'

// بيانات وهمية مؤقتة
const mockPayments = [
  { id: 1, student: 'محمد الأحمد', amount: 500, date: '2026-04-01', status: 'paid' as const },
  { id: 2, student: 'سارة العمري', amount: 500, date: '2026-04-03', status: 'pending' as const },
  { id: 3, student: 'عمر الزهراني', amount: 500, date: '2026-03-01', status: 'overdue' as const },
  { id: 4, student: 'نورة القحطاني', amount: 500, date: '2026-04-05', status: 'paid' as const },
  { id: 5, student: 'يوسف الشهري', amount: 500, date: '2026-04-02', status: 'paid' as const },
]

const statusLabel = { paid: 'مدفوع', pending: 'معلق', overdue: 'متأخر' }
const statusClass = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
}

function Payments() {
  const [payments] = useState(mockPayments)

  const total = payments.reduce((sum, p) => sum + p.amount, 0)
  const paid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const pending = payments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">المدفوعات</h1>
        <p className="text-gray-500 text-sm mt-1">متابعة رسوم الطلاب</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-gray-500 text-sm">إجمالي الرسوم</p>
          <p className="text-2xl font-bold text-blue-600">{total} ر.س</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-gray-500 text-sm">المدفوع</p>
          <p className="text-2xl font-bold text-green-600">{paid} ر.س</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-gray-500 text-sm">المتبقي</p>
          <p className="text-2xl font-bold text-red-600">{pending} ر.س</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-right px-4 py-3">#</th>
              <th className="text-right px-4 py-3">الطالب</th>
              <th className="text-right px-4 py-3">المبلغ</th>
              <th className="text-right px-4 py-3">التاريخ</th>
              <th className="text-right px-4 py-3">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{p.id}</td>
                <td className="px-4 py-3 font-medium">{p.student}</td>
                <td className="px-4 py-3">{p.amount} ر.س</td>
                <td className="px-4 py-3 text-gray-500">{p.date}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass[p.status]}`}>
                    {statusLabel[p.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Payments