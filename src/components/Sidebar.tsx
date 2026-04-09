import { Link } from 'react-router-dom'

function Sidebar() {
  return (
    <div className="bg-gray-900 text-white w-64 h-screen flex flex-col p-4">
      <h1 className="text-xl font-bold mb-8">🎓 EduSystem</h1>
      
      <nav className="flex flex-col gap-2">
        <Link to="/" className="p-3 rounded hover:bg-gray-700">
          📊 Dashboard
        </Link>
        <Link to="/students" className="p-3 rounded hover:bg-gray-700">
          👨‍🎓 Students
        </Link>
        <Link to="/teachers" className="p-3 rounded hover:bg-gray-700">
          👨‍🏫 Teachers
        </Link>
        <Link to="/attendance" className="p-3 rounded hover:bg-gray-700">
          ✅ Attendance
        </Link>
        <Link to="/payments" className="p-3 rounded hover:bg-gray-700">
          💰 Payments
        </Link>
        <Link to="/reports" className="p-3 rounded hover:bg-gray-700">
          📈 Reports
        </Link>
      </nav>
    </div>
  )
}

export default Sidebar