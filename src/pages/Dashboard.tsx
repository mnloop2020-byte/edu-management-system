import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const attendanceData = [
  { day: 'السبت', students: 110 },
  { day: 'الأحد', students: 118 },
  { day: 'الاثنين', students: 105 },
  { day: 'الثلاثاء', students: 120 },
  { day: 'الأربعاء', students: 115 },
]

function Dashboard() {
  const stats = [
    { title: 'Total Students', value: '124', icon: '👨‍🎓', color: 'bg-blue-500' },
    { title: 'Total Teachers', value: '18', icon: '👨‍🏫', color: 'bg-green-500' },
    { title: 'Attendance Today', value: '98%', icon: '✅', color: 'bg-yellow-500' },
    { title: 'Pending Payments', value: '12', icon: '💰', color: 'bg-red-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl p-6 shadow">
            <div className={`${stat.color} text-white text-3xl w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
              {stat.icon}
            </div>
            <p className="text-gray-500 text-sm">{stat.title}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="text-lg font-bold mb-4">الحضور هذا الأسبوع</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Dashboard




