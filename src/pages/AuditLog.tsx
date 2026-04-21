import { useEffect, useState } from 'react'
import api from '../api/api'
import { EmptyState } from '../components/ui/EmptyState'

interface AuditEntry {
  id: number
  action: string
  entityType: string
  entityId: string | null
  summary: string
  createdAt: string
  actorUser?: { name: string; email: string; role: string } | null
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await api.get('/audit')
        if (!active) return
        setLogs(res.data.logs ?? [])
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  if (loading) {
    return <div className="card p-6 text-[13px]" style={{ color: 'var(--text-muted)' }}>Loading audit log...</div>
  }

  if (logs.length === 0) {
    return <div className="card"><EmptyState title="No audit activity yet" message="System changes and critical actions will appear here." /></div>
  }

  return (
    <section className="card overflow-hidden">
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>Audit Log</h3>
        <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Tracked changes across students, payments, academics, and communications</p>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {logs.map((log) => (
          <div key={log.id} className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{log.summary}</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {log.action} • {log.entityType}{log.entityId ? ` #${log.entityId}` : ''} • {log.actorUser?.name || 'System'}
              </p>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{new Date(log.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
