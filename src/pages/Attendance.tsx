import { useState } from 'react'

// بيانات تجريبية
const mockStudents = [
  { id: 1, name: 'محمد الأحمد', grade: 'الصف الأول' },
  { id: 2, name: 'سارة العمري', grade: 'الصف الثاني' },
  { id: 3, name: 'عمر الزهراني', grade: 'الصف الثالث' },
  { id: 4, name: 'نورة القحطاني', grade: 'الصف الأول' },
  { id: 5, name: 'يوسف الشهري', grade: 'الصف الثاني' },
]

type Status = 'present' | 'absent' | 'late'

function Attendance() {
  const today = new Date().toLocaleDateString('ar-SA')

  // حالة كل طالب — افتراضياً حاضر
  const [attendance, setAttendance] = useState<Record<number, Status>>(
    Object.fromEntries(mockStudents.map(s => [s.id, 'present']))
  )

  function setStatus(id: number, status: Status) {
    setAttendance(prev => ({ ...prev, [id]: status }))
  }

  const present = Object.values(attendance).filter(s => s === 'present').length
  const absent = Object.values(attendance).filter(s => s === 'absent').length
  const late = Object.values(attendance).filter(s => s === 'late').length

  const statusLabel: Record<Status, string> = {
    present: 'حاضر',
    absent: 'غائب',
    late: 'متأخر',
  }

  const statusClass: Record<Status, string> = {
    present: 'bg-green-100 text-green-700 border-green-200',
    absent: 'bg-red-100 text-red-700 border-red-200',
    late: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  }

  return (
    <div dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">الحضور والغياب</h1>
        <p className="text-gray-500 text-sm mt-1">اليوم: {today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-gray-500 text-sm">حاضر</p>
          <p className="text-2xl font-bold text-green-600">{present}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-gray-500 text-sm">غائب</p>
          <p className="text-2xl font-bold text-red-600">{absent}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-gray-500 text-sm">متأخر</p>
          <p className="text-2xl font-bold text-yellow-600">{late}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-right px-4 py-3">#</th>
              <th className="text-right px-4 py-3">الطالب</th>
              <th className="text-right px-4 py-3">الصف</th>
              <th className="text-right px-4 py-3">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {mockStudents.map(s => (
              <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{s.id}</td>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-gray-600">{s.grade}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {(['present', 'absent', 'late'] as Status[]).map(status => (
                      <button
                        key={status}
                        onClick={() => setStatus(s.id, status)}
                        className={`px-3 py-1 rounded-full text-xs border ${
                          attendance[s.id] === status
                            ? statusClass[status]
                            : 'bg-gray-100 text-gray-400 border-gray-200'
                        }`}
                      >
                        {statusLabel[status]}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Attendance