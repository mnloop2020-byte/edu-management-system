import { useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../hooks/useLocale'
import { toast } from '../components/ui/Toast'

interface WorkflowRule {
  id: string
  name: string
  trigger: string
  condition: string
  action: string
  active: boolean
}

type DragType = 'trigger' | 'condition' | 'action'

function getOptions(locale: 'ar' | 'en') {
  if (locale === 'ar') {
    return {
      triggerOptions: ['تجاوز الغياب 3 مرات', 'أصبحت الدفعة متأخرة', 'انخفض الأداء عن الحد', 'تم تسليم الواجب متأخرًا'],
      conditionOptions: ['الطالب نشط', 'لهذا الفصل فقط', 'للحالات عالية الأولوية فقط', 'التطبيق على الصف المحدد'],
      actionOptions: ['إرسال تنبيه', 'إنشاء مهمة متابعة', 'إشعار المعلم', 'إنشاء تقرير أسبوعي'],
      starterRules: [
        { id: 'wf-1', name: 'تنبيه مخاطر الغياب', trigger: 'تجاوز الغياب 3 مرات', condition: 'لهذا الفصل فقط', action: 'إرسال تنبيه', active: true },
        { id: 'wf-2', name: 'متابعة الدفعات المتأخرة', trigger: 'أصبحت الدفعة متأخرة', condition: 'للحالات عالية الأولوية فقط', action: 'إشعار المعلم', active: true },
      ],
    }
  }

  return {
    triggerOptions: ['Absence exceeds 3', 'Payment becomes overdue', 'Performance drops below threshold', 'Assignment submitted late'],
    conditionOptions: ['Student is active', 'Only this semester', 'Only high-priority cases', 'Apply to selected class'],
    actionOptions: ['Send alert', 'Create follow-up task', 'Notify teacher', 'Generate weekly report'],
    starterRules: [
      { id: 'wf-1', name: 'Absence Risk Alert', trigger: 'Absence exceeds 3', condition: 'Only this semester', action: 'Send alert', active: true },
      { id: 'wf-2', name: 'Overdue Payment Follow-up', trigger: 'Payment becomes overdue', condition: 'Only high-priority cases', action: 'Notify teacher', active: true },
    ],
  }
}

function getCopy(locale: 'ar' | 'en') {
  return locale === 'ar'
    ? {
        loadWarning: 'تم استخدام قواعد البداية المحلية',
        saveError: 'فشل حفظ القواعد',
        loading: 'جارٍ تحميل سير العمل...',
        studio: 'استوديو الأتمتة',
        title: 'ابنِ سير عمل ذكي دون مغادرة لوحة التحكم.',
        subtitle: 'أنشئ قواعد تشغيلية، واسحب كتل المنطق إلى مكانها، وحافظ على طبقة الأتمتة خفيفة وسريعة.',
        activeWorkflows: 'سير عمل نشط',
        saving: 'جارٍ الحفظ...',
        createWorkflow: 'إنشاء سير عمل',
        workflowName: 'اسم سير العمل',
        logicBlocks: 'كتل المنطق',
        dragIntoCanvas: 'اسحب إلى اللوحة',
        triggers: 'المحفزات',
        conditions: 'الشروط',
        actions: 'الإجراءات',
        savedWorkflows: 'سير العمل المحفوظ',
        rules: 'قاعدة',
        active: 'نشط',
        paused: 'متوقف',
        up: 'أعلى',
        down: 'أسفل',
        workflowCanvas: 'لوحة سير العمل',
        canvasSubtitle: 'ضع محفزًا وشرطًا وإجراءً في أماكنها',
        pause: 'إيقاف',
        resume: 'استئناف',
        delete: 'حذف',
        selectWorkflow: 'اختر سير عمل لتعديل المحفز والشرط والإجراء.',
        when: 'عندما',
        if: 'إذا',
        then: 'إذًا',
        trigger: 'المحفز',
        condition: 'الشرط',
        action: 'الإجراء',
        dropHere: 'أسقط الكتلة المناسبة هنا',
      }
    : {
        loadWarning: 'Using local starter workflows',
        saveError: 'Failed to save workflows',
        loading: 'Loading workflows...',
        studio: 'Automation Studio',
        title: 'Build smart workflows without leaving the dashboard.',
        subtitle: 'Create operational rules, drag logic blocks into place, and keep the automation layer lightweight.',
        activeWorkflows: 'active workflows',
        saving: 'Saving...',
        createWorkflow: 'Create Workflow',
        workflowName: 'Workflow name',
        logicBlocks: 'Logic Blocks',
        dragIntoCanvas: 'Drag into the canvas',
        triggers: 'Triggers',
        conditions: 'Conditions',
        actions: 'Actions',
        savedWorkflows: 'Saved Workflows',
        rules: 'rules',
        active: 'Active',
        paused: 'Paused',
        up: 'Up',
        down: 'Down',
        workflowCanvas: 'Workflow Canvas',
        canvasSubtitle: 'Drop trigger, condition, and action blocks into place',
        pause: 'Pause',
        resume: 'Resume',
        delete: 'Delete',
        selectWorkflow: 'Select a workflow to edit its trigger, condition, and action.',
        when: 'When',
        if: 'If',
        then: 'Then',
        trigger: 'Trigger',
        condition: 'Condition',
        action: 'Action',
        dropHere: 'Drop a matching block here',
      }
}

function readDraggedValue(event: DragEvent<HTMLDivElement>) {
  const raw = event.dataTransfer.getData('application/json')
  if (!raw) return null

  try {
    return JSON.parse(raw) as { type: DragType; value: string }
  } catch {
    return null
  }
}

export default function WorkflowBuilder() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const copy = getCopy(locale)
  const options = useMemo(() => getOptions(locale), [locale])
  const { triggerOptions, conditionOptions, actionOptions, starterRules } = options
  const isAdmin = user?.role === 'ADMIN'
  const [rules, setRules] = useState<WorkflowRule[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', trigger: triggerOptions[0], condition: conditionOptions[0], action: actionOptions[0] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const saveTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setForm({ name: '', trigger: triggerOptions[0], condition: conditionOptions[0], action: actionOptions[0] })
  }, [triggerOptions, conditionOptions, actionOptions])

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        setLoading(true)
        const res = await api.get('/settings')
        const savedValue = res.data.settings?.automationWorkflows
        const parsed = savedValue ? (JSON.parse(savedValue) as WorkflowRule[]) : []
        const nextRules = parsed.length > 0 ? parsed : starterRules

        if (!active) return
        setRules(nextRules)
        setSelectedId(nextRules[0]?.id ?? null)
      } catch {
        if (!active) return
        setRules(starterRules)
        setSelectedId(starterRules[0]?.id ?? null)
        toast.warning(copy.loadWarning)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    }
  }, [starterRules, copy.loadWarning])

  useEffect(() => {
    if (loading || !isAdmin || rules.length === 0) return

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        setSaving(true)
        await api.post('/settings', {
          key: 'automationWorkflows',
          value: JSON.stringify(rules),
        })
      } catch {
        toast.error(copy.saveError)
      } finally {
        setSaving(false)
      }
    }, 350)
  }, [rules, isAdmin, loading, copy.saveError])

  const selected = useMemo(() => rules.find(rule => rule.id === selectedId) || null, [rules, selectedId])

  function createRule() {
    const name = form.name.trim() || `${copy.createWorkflow} ${rules.length + 1}`
    const next: WorkflowRule = {
      id: `wf-${Date.now()}`,
      name,
      trigger: form.trigger,
      condition: form.condition,
      action: form.action,
      active: true,
    }
    setRules(current => [next, ...current])
    setSelectedId(next.id)
    setForm(current => ({ ...current, name: '' }))
  }

  function updateSelected(patch: Partial<WorkflowRule>) {
    if (!selectedId) return
    setRules(current => current.map(rule => rule.id === selectedId ? { ...rule, ...patch } : rule))
  }

  function deleteSelected() {
    if (!selectedId) return
    const next = rules.filter(rule => rule.id !== selectedId)
    setRules(next)
    setSelectedId(next[0]?.id ?? null)
  }

  function moveRule(ruleId: string, direction: 'up' | 'down') {
    setRules(current => {
      const index = current.findIndex(rule => rule.id === ruleId)
      if (index === -1) return current

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= current.length) return current

      const next = [...current]
      const [rule] = next.splice(index, 1)
      next.splice(targetIndex, 0, rule)
      return next
    })
  }

  function handleDrop(slot: DragType, event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const payload = readDraggedValue(event)
    if (!payload || payload.type !== slot) return

    if (slot === 'trigger') updateSelected({ trigger: payload.value })
    if (slot === 'condition') updateSelected({ condition: payload.value })
    if (slot === 'action') updateSelected({ action: payload.value })
  }

  if (loading) {
    return <div className="card p-8 text-[13px]" style={{ color: 'var(--text-muted)' }}>{copy.loading}</div>
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <section className="card p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(circle at top right, rgba(124,58,237,0.18), transparent 40%)' }} />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-faint)' }}>{copy.studio}</p>
            <h2 className="text-[26px] font-extrabold mt-2" style={{ color: 'var(--text)' }}>{copy.title}</h2>
            <p className="text-[13px] mt-3 max-w-[680px]" style={{ color: 'var(--text-muted)' }}>{copy.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-purple">{rules.filter(rule => rule.active).length} {copy.activeWorkflows}</span>
            {saving && <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.saving}</span>}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[0.92fr_1.08fr] gap-4">
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-[14px] font-bold mb-4" style={{ color: 'var(--text)' }}>{copy.createWorkflow}</h3>
            <div className="space-y-3">
              <input className="input" placeholder={copy.workflowName} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <select className="input" value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })}>
                {triggerOptions.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
              <select className="input" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
                {conditionOptions.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
              <select className="input" value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}>
                {actionOptions.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
              <button onClick={createRule} className="btn-primary w-full py-2.5 text-[13px] rounded-xl">{copy.createWorkflow}</button>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.logicBlocks}</h3>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.dragIntoCanvas}</span>
            </div>
            <div className="space-y-4">
              <OptionTray title={copy.triggers} tone="#a78bfa" type="trigger" items={triggerOptions} />
              <OptionTray title={copy.conditions} tone="#60a5fa" type="condition" items={conditionOptions} />
              <OptionTray title={copy.actions} tone="#10b981" type="action" items={actionOptions} />
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.savedWorkflows}</h3>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{rules.length} {copy.rules}</span>
            </div>
            <div className="space-y-2.5">
              {rules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="rounded-xl p-4 transition-all"
                  style={{
                    background: selectedId === rule.id ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${selectedId === rule.id ? 'rgba(124,58,237,0.3)' : 'var(--border)'}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button onClick={() => setSelectedId(rule.id)} className="text-left flex-1">
                      <p className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>{rule.name}</p>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{rule.trigger}</p>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <span className={`badge ${rule.active ? 'badge-success' : 'badge-warning'}`}>{rule.active ? copy.active : copy.paused}</span>
                      <button onClick={() => moveRule(rule.id, 'up')} disabled={index === 0} className="btn-ghost px-2 py-1 text-[10px]">{copy.up}</button>
                      <button onClick={() => moveRule(rule.id, 'down')} disabled={index === rules.length - 1} className="btn-ghost px-2 py-1 text-[10px]">{copy.down}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{copy.workflowCanvas}</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.canvasSubtitle}</p>
            </div>
            {selected && (
              <div className="flex items-center gap-2">
                <button onClick={() => updateSelected({ active: !selected.active })} className="btn-ghost px-3 py-1.5 text-[12px]">
                  {selected.active ? copy.pause : copy.resume}
                </button>
                <button onClick={deleteSelected} className="btn-ghost px-3 py-1.5 text-[12px]" style={{ color: '#f87171' }}>{copy.delete}</button>
              </div>
            )}
          </div>

          {!selected ? (
            <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed var(--border)' }}>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{copy.selectWorkflow}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <DropZone title={copy.when} value={selected.trigger} color="#a78bfa" type="trigger" onDrop={handleDrop} copy={copy} />
                <DropZone title={copy.if} value={selected.condition} color="#60a5fa" type="condition" onDrop={handleDrop} copy={copy} />
                <DropZone title={copy.then} value={selected.action} color="#10b981" type="action" onDrop={handleDrop} copy={copy} />
              </div>

              <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)' }}>
                <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
                  <FlowBlock title={copy.when} value={selected.trigger} color="#a78bfa" />
                  <Arrow />
                  <FlowBlock title={copy.if} value={selected.condition} color="#60a5fa" />
                  <Arrow />
                  <FlowBlock title={copy.then} value={selected.action} color="#10b981" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{copy.workflowName}</label>
                  <input className="input" value={selected.name} onChange={e => updateSelected({ name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{copy.trigger}</label>
                  <select className="input" value={selected.trigger} onChange={e => updateSelected({ trigger: e.target.value })}>
                    {triggerOptions.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{copy.condition}</label>
                  <select className="input" value={selected.condition} onChange={e => updateSelected({ condition: e.target.value })}>
                    {conditionOptions.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{copy.action}</label>
                  <select className="input" value={selected.action} onChange={e => updateSelected({ action: e.target.value })}>
                    {actionOptions.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function OptionTray({ title, tone, type, items }: { title: string; tone: string; type: DragType; items: string[] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <button
            key={item}
            draggable
            onDragStart={event => {
              event.dataTransfer.effectAllowed = 'copy'
              event.dataTransfer.setData('application/json', JSON.stringify({ type, value: item }))
            }}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold"
            style={{ background: `${tone}18`, color: tone, border: `1px solid ${tone}33` }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

function DropZone({
  title,
  value,
  color,
  type,
  onDrop,
  copy,
}: {
  title: string
  value: string
  color: string
  type: DragType
  onDrop: (type: DragType, event: DragEvent<HTMLDivElement>) => void
  copy: ReturnType<typeof getCopy>
}) {
  return (
    <div
      onDragOver={event => event.preventDefault()}
      onDrop={event => onDrop(type, event)}
      className="rounded-xl p-4 text-center transition-all"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px dashed ${color}55` }}
    >
      <p className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-faint)' }}>{title}</p>
      <p className="text-[13px] font-semibold mt-2" style={{ color }}>{value}</p>
      <p className="text-[10px] mt-2" style={{ color: 'var(--text-faint)' }}>{copy.dropHere}</p>
    </div>
  )
}

function FlowBlock({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="min-w-[180px] rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
      <p className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-faint)' }}>{title}</p>
      <p className="text-[12px] font-semibold mt-2" style={{ color }}>{value}</p>
    </div>
  )
}

function Arrow() {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(124,58,237,0.12)', color: '#a78bfa' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M5 12h14" />
        <path d="M13 6l6 6-6 6" />
      </svg>
    </div>
  )
}
