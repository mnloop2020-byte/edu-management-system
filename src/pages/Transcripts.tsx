import { useEffect, useState } from 'react'
import api from '../api/api'
import { EmptyState } from '../components/ui/EmptyState'

interface StudentOption { id: number; name: string }
interface TranscriptPayload {
  student: { id: number; name: string; course: string; status: string; joinedAt: string }
  summary: {
    gpa: number | null
    totalSubjects: number
    totalEarnedCredits: number
    attendanceRate: number
    paidAmount: number
    outstanding: number
    letterGrade: string
  }
  subjects: Array<{
    id: number
    name: string
    code: string
    credits: number
    totalScore: number | null
    finalLetterGrade: string
    status: string
  }>
}

export default function Transcripts() {
  const [students, setStudents] = useState<StudentOption[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [transcript, setTranscript] = useState<TranscriptPayload | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const res = await api.get('/students')
      if (!active) return
      const items = (res.data.students ?? []).map((item: StudentOption) => ({ id: item.id, name: item.name }))
      setStudents(items)
      if (items[0]) setSelectedStudentId(String(items[0].id))
    })()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedStudentId) return
    let active = true
    ;(async () => {
      const res = await api.get(`/transcripts/student/${selectedStudentId}`)
      if (!active) return
      setTranscript(res.data)
    })()
    return () => { active = false }
  }, [selectedStudentId])

  if (students.length === 0) {
    return <div className="card"><EmptyState title="No students available" message="Create students to generate transcripts." /></div>
  }

  return (
    <div className="space-y-5">
      <section className="card p-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>Transcript Center</h3>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Academic summary ready for review and printing</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input min-w-[220px]" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
            {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
          </select>
          <button onClick={() => window.print()} className="btn-primary px-4 py-2 rounded-xl text-[12px]">Print</button>
        </div>
      </section>

      {transcript && (
        <section className="card p-6 space-y-5">
          <div>
            <h2 className="text-[24px] font-extrabold" style={{ color: 'var(--text)' }}>{transcript.student.name}</h2>
            <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>{transcript.student.course} • {transcript.student.status}</p>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
            {[
              ['GPA', transcript.summary.gpa === null ? 'N/A' : transcript.summary.gpa.toFixed(2)],
              ['Letter', transcript.summary.letterGrade || 'N/A'],
              ['Subjects', transcript.summary.totalSubjects],
              ['Credits', transcript.summary.totalEarnedCredits],
              ['Attendance', `${transcript.summary.attendanceRate}%`],
              ['Outstanding', transcript.summary.outstanding],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{label}</p>
                <p className="text-[18px] font-bold mt-1" style={{ color: 'var(--text)' }}>{value}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Subject', 'Code', 'Credits', 'Total', 'Final Grade', 'Status'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transcript.subjects.map((subject) => (
                  <tr key={subject.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text)' }}>{subject.name}</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>{subject.code}</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text)' }}>{subject.credits}</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text)' }}>{subject.totalScore === null ? 'N/A' : `${subject.totalScore.toFixed(1)}%`}</td>
                    <td className="px-4 py-3"><span className="badge badge-purple">{subject.finalLetterGrade}</span></td>
                    <td className="px-4 py-3"><span className={`badge ${subject.status === 'Pass' ? 'badge-success' : subject.status === 'Fail' ? 'badge-error' : 'badge-warning'}`}>{subject.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
