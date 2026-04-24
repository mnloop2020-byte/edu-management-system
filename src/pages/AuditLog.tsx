import { useEffect, useState } from 'react'
import api from '../api/api'
import { EmptyState } from '../components/ui/EmptyState'
import { useLocale } from '../hooks/useLocale'
import { localizeAuditAction, localizeAuditEntity, localizeAuditSummary } from '../utils/academicLocalization'

interface AuditEntry {
  id: number
  action: string
  entityType: string
  entityId: string | null
  summary: string
  createdAt: string
  actorUser?: { name: string; email: string; role: string } | null
}

function getCopy(locale: 'ar' | 'en') {
  return locale === 'ar'
    ? {
        loading: 'جارٍ تحميل سجل التدقيق...',
        noActivity: 'لا توجد أنشطة بعد',
        noActivityMessage: 'ستظهر هنا جميع تغييرات النظام والعمليات المهمة.',
        title: 'سجل التدقيق',
        subtitle: 'تتبع التغييرات عبر الطلاب والمدفوعات والأكاديميا والتواصل.',
        system: 'النظام',
      }
    : {
        loading: 'Loading audit log...',
        noActivity: 'No audit activity yet',
        noActivityMessage: 'System changes and critical actions will appear here.',
        title: 'Audit Log',
        subtitle: 'Tracked changes across students, payments, academics, and communications',
        system: 'System',
      }
}

export default function AuditLog() {
  const { locale } = useLocale()
  const copy = getCopy(locale)
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
    return <div className="card p-6 text-[13px]" style={{ color: 'var(--text-muted)' }}>{copy.loading}</div>
  }

  if (logs.length === 0) {
    return <div className="card"><EmptyState title={copy.noActivity} message={copy.noActivityMessage} /></div>
  }

  return (
    <section className="card overflow-hidden">
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{copy.title}</h3>
        <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.subtitle}</p>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {logs.map((log) => (
          <div key={log.id} className="flex items-start justify-between gap-4 px-5 py-4 flex-wrap">
            <div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                {localizeAuditSummary(log.summary, locale)}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {localizeAuditAction(log.action, locale)} • {localizeAuditEntity(log.entityType, locale)}{log.entityId ? ` #${log.entityId}` : ''} • {log.actorUser?.name || copy.system}
              </p>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
              {new Date(log.createdAt).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
