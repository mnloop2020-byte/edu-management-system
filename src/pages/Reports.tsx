import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// بيانات وهمية مؤقتة
const attendanceData = [
  { month: 'يناير', present: 110, absent: 14 },
  { month: 'فبراير', present: 105, absent: 19 },
  { month: 'مارس', present: 118, absent: 6 },
  { month: 'أبريل', present: 112, absent: 12 },
]

const paymentData = [
  { name: 'مدفوع', value: 3, color: '#22c55e' },
  { name: 'معلق', value: 1, color: '#eab308' },
  { name: 'متأخر', value: 1, color: '#ef4444' },
]

function Reports() {
  return (
    <div dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">التقارير</h1>
        <p className="text-gray-500 text-sm mt-1">نظرة عامة على أداء المركز</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* تقرير الحضور */}
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="font-bold mb-4">الحضور الشهري</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="present" fill="#3b82f6" name="حاضر" radius={[4,4,0,0]} />
              <Bar dataKey="absent" fill="#ef4444" name="غائب" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* تقرير المدفوعات */}
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="font-bold mb-4">حالة المدفوعات</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {paymentData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Reports