import { useState } from 'react'

interface Student {
  id: number
  name: string
  grade: string
  parentName: string
  parentPhone: string
  attendance: number
  paymentStatus: 'paid' | 'pending' | 'overdue'
}

const mockStudents: Student[] = [
  { id: 1, name: 'محمد الأحمد', grade: 'الصف الأول', parentName: 'أحمد محمد', parentPhone: '0501234567', attendance: 95, paymentStatus: 'paid' },
  { id: 2, name: 'سارة العمري', grade: 'الصف الثاني', parentName: 'خالد العمري', parentPhone: '0507654321', attendance: 88, paymentStatus: 'pending' },
  { id: 3, name: 'عمر الزهراني', grade: 'الصف الثالث', parentName: 'فهد الزهراني', parentPhone: '0509876543', attendance: 72, paymentStatus: 'overdue' },
  { id: 4, name: 'نورة القحطاني', grade: 'الصف الأول', parentName: 'سعد القحطاني', parentPhone: '0501112233', attendance: 98, paymentStatus: 'paid' },
  { id: 5, name: 'يوسف الشهري', grade: 'الصف الثاني', parentName: 'ماجد الشهري', parentPhone: '0504445566', attendance: 85, paymentStatus: 'paid' },
  { id: 6, name: 'ريم الدوسري', grade: 'الصف الثالث', parentName: 'علي الدوسري', parentPhone: '0507778899', attendance: 60, paymentStatus: 'overdue' },
  { id: 7, name: 'عبدالله الغامدي', grade: 'الصف الأول', parentName: 'حسن الغامدي', parentPhone: '0502223344', attendance: 91, paymentStatus: 'pending' },
]

const emptyForm = {
  name: '',
  grade: '',
  parentName: '',
  parentPhone: '',
}

const paymentLabel = {
  paid: 'مدفوع',
  pending: 'معلق',
  overdue: 'متأخر',
}

const paymentClass = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
}

function Students() {
  const [students, setStudents] = useState<Student[]>(mockStudents)
  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('الكل')
  const [filterPayment, setFilterPayment] = useState('الكل')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // ── Filtered list ──
  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.includes(search) || String(s.id).includes(search)
    const matchGrade = filterGrade === 'الكل' || s.grade === filterGrade
    const matchPayment =
      filterPayment === 'الكل' || s.paymentStatus === filterPayment
    return matchSearch && matchGrade && matchPayment
  })

  const grades = ['الكل', ...Array.from(new Set(students.map((s) => s.grade)))]

  // ── Modal helpers ──
  function openAdd() {
    setForm(emptyForm)
    setEditId(null)
    setShowModal(true)
  }

  function openEdit(s: Student) {
    setForm({
      name: s.name,
      grade: s.grade,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
    })
    setEditId(s.id)
    setShowModal(true)
  }

  function handleSave() {
    if (!form.name || !form.grade) return
    if (editId !== null) {
      setStudents((prev) =>
        prev.map((s) => (s.id === editId ? { ...s, ...form } : s))
      )
    } else {
      const newStudent: Student = {
        id: Date.now(),
        ...form,
        attendance: 100,
        paymentStatus: 'pending',
      }
      setStudents((prev) => [newStudent, ...prev])
    }
    setShowModal(false)
  }

  function handleDelete(id: number) {
    setStudents((prev) => prev.filter((s) => s.id !== id))
    setDeleteId(null)
  }

  // ── Stats ──
  const total = students.length
  const paid = students.filter((s) => s.paymentStatus === 'paid').length
  const overdue = students.filter((s) => s.paymentStatus === 'overdue').length
  const lowAttendance = students.filter((s) => s.attendance < 75).length

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">الطلاب</h1>
          <p className="text-gray-500 text-sm mt-1">إدارة بيانات الطلاب المسجلين</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          + إضافة طالب
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-gray-500 text-sm">إجمالي الطلاب</p>
          <p className="text-2xl font-bold text-blue-600">{total}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-gray-500 text-sm">رسوم مدفوعة</p>
          <p className="text-2xl font-bold text-green-600">{paid}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-gray-500 text-sm">رسوم متأخرة</p>
          <p className="text-2xl font-bold text-red-600">{overdue}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-gray-500 text-sm">غياب متكرر</p>
          <p className="text-2xl font-bold text-yellow-600">{lowAttendance}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="بحث بالاسم أو الرقم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-400"
        />
        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {grades.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="الكل">كل الحالات</option>
          <option value="paid">مدفوع</option>
          <option value="pending">معلق</option>
          <option value="overdue">متأخر</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-right px-4 py-3 font-medium">#</th>
              <th className="text-right px-4 py-3 font-medium">الطالب</th>
              <th className="text-right px-4 py-3 font-medium">الصف</th>
              <th className="text-right px-4 py-3 font-medium">ولي الأمر</th>
              <th className="text-right px-4 py-3 font-medium">الحضور</th>
              <th className="text-right px-4 py-3 font-medium">الرسوم</th>
              <th className="text-right px-4 py-3 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  لا توجد نتائج
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{s.id}</td>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.grade}</td>
                  <td className="px-4 py-3">
                    <div>{s.parentName}</div>
                    <div className="text-gray-400 text-xs">{s.parentPhone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            s.attendance >= 85
                              ? 'bg-green-500'
                              : s.attendance >= 75
                              ? 'bg-yellow-400'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${s.attendance}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{s.attendance}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentClass[s.paymentStatus]}`}>
                      {paymentLabel[s.paymentStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="text-blue-500 hover:text-blue-700 text-xs border border-blue-200 px-2 py-1 rounded"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => setDeleteId(s.id)}
                        className="text-red-500 hover:text-red-700 text-xs border border-red-200 px-2 py-1 rounded"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination placeholder */}
        <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>عرض {filtered.length} من {total} طالب</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border rounded text-xs">‹</button>
            <button className="px-3 py-1 border rounded bg-blue-600 text-white text-xs">1</button>
            <button className="px-3 py-1 border rounded text-xs">›</button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[440px] shadow-xl" dir="rtl">
            <div className="flex justify-between items-center px-5 py-4 border-b">
              <h2 className="font-bold text-base">
                {editId !== null ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">اسم الطالب *</label>
                <input
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="محمد الأحمد"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">الصف *</label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                >
                  <option value="">اختر الصف</option>
                  <option>الصف الأول</option>
                  <option>الصف الثاني</option>
                  <option>الصف الثالث</option>
                  <option>الصف الرابع</option>
                  <option>الصف الخامس</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">اسم ولي الأمر</label>
                <input
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  value={form.parentName}
                  onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                  placeholder="أحمد محمد"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">رقم الجوال</label>
                <input
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  value={form.parentPhone}
                  onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                  placeholder="05xxxxxxxx"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
              >
                {editId !== null ? 'حفظ التعديلات' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[360px] shadow-xl p-6 text-center" dir="rtl">
            <div className="text-4xl mb-3">🗑️</div>
            <h2 className="font-bold text-base mb-2">تأكيد الحذف</h2>
            <p className="text-gray-500 text-sm mb-5">هل أنت متأكد من حذف هذا الطالب؟ لا يمكن التراجع.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Students