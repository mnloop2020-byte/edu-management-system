import { useState } from 'react'

// بيانات تجريبية للمدرسين
const mockTeachers = [
  { id: 1, name: 'أحمد السالم', subject: 'الرياضيات', phone: '0501234567', classes: 3 },
  { id: 2, name: 'فاطمة العلي', subject: 'العلوم', phone: '0507654321', classes: 2 },
  { id: 3, name: 'خالد المطيري', subject: 'اللغة العربية', phone: '0509876543', classes: 4 },
  { id: 4, name: 'نورة الشمري', subject: 'الإنجليزية', phone: '0501112233', classes: 3 },
]

function Teachers() {
  const [teachers, setTeachers] = useState(mockTeachers)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', subject: '', phone: '' })
  const [editId, setEditId] = useState<number | null>(null)

  function openAdd() {
    setForm({ name: '', subject: '', phone: '' })
    setEditId(null)
    setShowModal(true)
  }

  function openEdit(t: typeof mockTeachers[0]) {
    setForm({ name: t.name, subject: t.subject, phone: t.phone })
    setEditId(t.id)
    setShowModal(true)
  }

  function handleSave() {
    if (!form.name || !form.subject) return
    if (editId !== null) {
      setTeachers(prev => prev.map(t => t.id === editId ? { ...t, ...form } : t))
    } else {
      setTeachers(prev => [...prev, { id: Date.now(), ...form, classes: 0 }])
    }
    setShowModal(false)
  }

  function handleDelete(id: number) {
    setTeachers(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">المدرسون</h1>
          <p className="text-gray-500 text-sm mt-1">إدارة بيانات المدرسين</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + إضافة مدرس
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-gray-500 text-sm">إجمالي المدرسين</p>
          <p className="text-2xl font-bold text-blue-600">{teachers.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-right px-4 py-3">#</th>
              <th className="text-right px-4 py-3">الاسم</th>
              <th className="text-right px-4 py-3">المادة</th>
              <th className="text-right px-4 py-3">الجوال</th>
              <th className="text-right px-4 py-3">الفصول</th>
              <th className="text-right px-4 py-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{t.id}</td>
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3">{t.subject}</td>
                <td className="px-4 py-3">{t.phone}</td>
                <td className="px-4 py-3">{t.classes} فصول</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(t)}
                      className="text-blue-500 text-xs border border-blue-200 px-2 py-1 rounded"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-red-500 text-xs border border-red-200 px-2 py-1 rounded"
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[400px] shadow-xl" dir="rtl">
            <div className="flex justify-between items-center px-5 py-4 border-b">
              <h2 className="font-bold">{editId ? 'تعديل مدرس' : 'إضافة مدرس'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400">✕</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">الاسم *</label>
                <input
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="اسم المدرس"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">المادة *</label>
                <input
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="مثال: الرياضيات"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">الجوال</label>
                <input
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="05xxxxxxxx"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="border px-4 py-2 rounded-lg text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
              >
                {editId ? 'حفظ' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Teachers