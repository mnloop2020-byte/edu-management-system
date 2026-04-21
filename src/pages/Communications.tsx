import { useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import { Modal } from '../components/ui/Modal'
import { toast } from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'

interface StudentOption { id: number; name: string }
interface TeacherOption { id: number; name: string }
interface ParentOption { id: number; name: string }

interface CommunicationTemplate {
  id: number
  name: string
  description: string | null
  audienceType: 'ALL' | 'STUDENT' | 'TEACHER' | 'PARENT'
  channel: 'IN_APP' | 'EMAIL' | 'SMS'
  status: 'ACTIVE' | 'ARCHIVED'
  subjectTemplate: string
  bodyTemplate: string
  variables: string[]
}

interface Communication {
  id: number
  subject: string
  body: string
  audienceType: 'ALL' | 'STUDENT' | 'TEACHER' | 'PARENT'
  channel: 'IN_APP' | 'EMAIL' | 'SMS'
  status: 'DRAFT' | 'SENT' | 'SCHEDULED'
  createdAt: string
  createdBy?: { name: string } | null
  template?: { id: number; name: string } | null
}

const parseVariablesText = (raw: string) => {
  const variables: Record<string, string> = {}
  raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const index = line.indexOf('=')
      if (index <= 0) return
      const key = line.slice(0, index).trim()
      const value = line.slice(index + 1).trim()
      if (key) variables[key] = value
    })
  return variables
}

export default function Communications() {
  const { user } = useAuth()
  const canCompose = user?.role === 'ADMIN' || user?.role === 'TEACHER'

  const [messages, setMessages] = useState<Communication[]>([])
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [parents, setParents] = useState<ParentOption[]>([])
  const [open, setOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [seedingDefaults, setSeedingDefaults] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null)

  const [form, setForm] = useState({
    templateId: '',
    subject: '',
    body: '',
    audienceType: 'ALL',
    channel: 'IN_APP',
    status: 'DRAFT',
    recipientStudentId: '',
    recipientTeacherId: '',
    recipientParentId: '',
    variablesText: '',
  })

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    audienceType: 'ALL',
    channel: 'IN_APP',
    status: 'ACTIVE',
    subjectTemplate: '',
    bodyTemplate: '',
  })

  const activeTemplates = useMemo(() => templates.filter((template) => template.status === 'ACTIVE'), [templates])
  const selectedTemplate = useMemo(
    () => activeTemplates.find((template) => template.id === Number(form.templateId)) || null,
    [activeTemplates, form.templateId],
  )

  useEffect(() => {
    if (!selectedTemplate) return
    setForm((current) => ({
      ...current,
      audienceType: selectedTemplate.audienceType,
      channel: selectedTemplate.channel,
      recipientStudentId: selectedTemplate.audienceType === 'STUDENT' ? current.recipientStudentId : '',
      recipientTeacherId: selectedTemplate.audienceType === 'TEACHER' ? current.recipientTeacherId : '',
      recipientParentId: selectedTemplate.audienceType === 'PARENT' ? current.recipientParentId : '',
    }))
  }, [selectedTemplate])

  async function loadData() {
    const [messagesRes, templatesRes, studentsRes, teachersRes, parentsRes] = await Promise.all([
      api.get('/communications'),
      api.get('/communications/templates'),
      api.get('/students'),
      api.get('/teachers'),
      api.get('/parents').catch(() => ({ data: { parents: [] } })),
    ])

    setMessages(messagesRes.data.messages ?? [])
    setTemplates(templatesRes.data.templates ?? [])
    setStudents((studentsRes.data.students ?? []).map((item: StudentOption) => ({ id: item.id, name: item.name })))
    setTeachers((teachersRes.data.teachers ?? []).map((item: TeacherOption) => ({ id: item.id, name: item.name })))
    setParents((parentsRes.data.parents ?? []).map((item: ParentOption) => ({ id: item.id, name: item.name })))
  }

  useEffect(() => {
    void loadData()
  }, [])

  function resetComposeForm() {
    setForm({
      templateId: '',
      subject: '',
      body: '',
      audienceType: 'ALL',
      channel: 'IN_APP',
      status: 'DRAFT',
      recipientStudentId: '',
      recipientTeacherId: '',
      recipientParentId: '',
      variablesText: '',
    })
  }

  function resetTemplateForm() {
    setTemplateForm({
      name: '',
      description: '',
      audienceType: 'ALL',
      channel: 'IN_APP',
      status: 'ACTIVE',
      subjectTemplate: '',
      bodyTemplate: '',
    })
    setEditingTemplateId(null)
  }

  async function handleApplyTemplate() {
    if (!form.templateId) return
    try {
      const res = await api.post(`/communications/templates/${form.templateId}/render`, {
        audienceType: form.audienceType,
        channel: form.channel,
        status: form.status,
        recipientStudentId: form.recipientStudentId || null,
        recipientTeacherId: form.recipientTeacherId || null,
        recipientParentId: form.recipientParentId || null,
        variables: parseVariablesText(form.variablesText),
      })

      setForm((current) => ({
        ...current,
        subject: res.data.rendered.subject ?? '',
        body: res.data.rendered.body ?? '',
      }))

      const missingVariables: string[] = res.data.missingVariables ?? []
      if (missingVariables.length > 0) {
        toast.error(`Missing variables: ${missingVariables.join(', ')}`)
      } else {
        toast.success('Template applied successfully')
      }
    } catch {
      toast.error('Failed to apply template')
    }
  }

  async function handleCreateCommunication() {
    setSaving(true)
    try {
      await api.post('/communications', {
        templateId: form.templateId || null,
        subject: form.subject,
        body: form.body,
        audienceType: form.audienceType,
        channel: form.channel,
        status: form.status,
        recipientStudentId: form.recipientStudentId || null,
        recipientTeacherId: form.recipientTeacherId || null,
        recipientParentId: form.recipientParentId || null,
        variables: parseVariablesText(form.variablesText),
      })

      setOpen(false)
      resetComposeForm()
      await loadData()
      toast.success('Communication created')
    } catch {
      toast.error('Failed to create communication')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveTemplate() {
    setTemplateSaving(true)
    try {
      const payload = {
        ...templateForm,
        description: templateForm.description || null,
      }

      if (editingTemplateId) {
        await api.put(`/communications/templates/${editingTemplateId}`, payload)
        toast.success('Template updated')
      } else {
        await api.post('/communications/templates', payload)
        toast.success('Template created')
      }

      resetTemplateForm()
      await loadData()
    } catch {
      toast.error('Failed to save template')
    } finally {
      setTemplateSaving(false)
    }
  }

  async function handleSeedDefaults() {
    if (seedingDefaults) return
    setSeedingDefaults(true)
    try {
      const res = await api.post('/communications/templates/seed/defaults')
      const result = res.data?.result
      await loadData()
      toast.success(`Loaded defaults: ${result?.created ?? 0} created, ${result?.skipped ?? 0} skipped`)
    } catch {
      toast.error('Failed to load default templates')
    } finally {
      setSeedingDefaults(false)
    }
  }

  function startEditTemplate(template: CommunicationTemplate) {
    setEditingTemplateId(template.id)
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      audienceType: template.audienceType,
      channel: template.channel,
      status: template.status,
      subjectTemplate: template.subjectTemplate,
      bodyTemplate: template.bodyTemplate,
    })
    setTemplateOpen(true)
  }

  return (
    <div className="space-y-5">
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Compose Message"
        footer={
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="btn-ghost flex-1 py-2 rounded-xl">Cancel</button>
            <button onClick={() => void handleCreateCommunication()} disabled={saving || !form.subject || !form.body} className="btn-primary flex-1 py-2 rounded-xl">
              {saving ? 'Saving...' : 'Send / Save'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <select className="input" value={form.templateId} onChange={(e) => setForm((current) => ({ ...current, templateId: e.target.value }))}>
              <option value="">No template</option>
              {activeTemplates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
            <button onClick={() => void handleApplyTemplate()} disabled={!form.templateId} className="btn-ghost px-4 py-2 rounded-xl text-[12px]">
              Apply Template
            </button>
          </div>

          <input className="input" placeholder="Subject" value={form.subject} onChange={(e) => setForm((current) => ({ ...current, subject: e.target.value }))} />
          <textarea className="input min-h-[120px]" placeholder="Message body" value={form.body} onChange={(e) => setForm((current) => ({ ...current, body: e.target.value }))} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select className="input" value={form.audienceType} onChange={(e) => setForm((current) => ({ ...current, audienceType: e.target.value, recipientStudentId: '', recipientTeacherId: '', recipientParentId: '' }))}>
              <option value="ALL">All</option>
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="PARENT">Parent</option>
            </select>
            <select className="input" value={form.channel} onChange={(e) => setForm((current) => ({ ...current, channel: e.target.value }))}>
              <option value="IN_APP">In-App</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
            </select>
            <select className="input" value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="SCHEDULED">Scheduled</option>
            </select>

            {form.audienceType === 'STUDENT' && (
              <select className="input" value={form.recipientStudentId} onChange={(e) => setForm((current) => ({ ...current, recipientStudentId: e.target.value }))}>
                <option value="">Select student</option>
                {students.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            )}
            {form.audienceType === 'TEACHER' && (
              <select className="input" value={form.recipientTeacherId} onChange={(e) => setForm((current) => ({ ...current, recipientTeacherId: e.target.value }))}>
                <option value="">Select teacher</option>
                {teachers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            )}
            {form.audienceType === 'PARENT' && (
              <select className="input" value={form.recipientParentId} onChange={(e) => setForm((current) => ({ ...current, recipientParentId: e.target.value }))}>
                <option value="">Select parent</option>
                {parents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            )}
          </div>

          <textarea
            className="input min-h-[92px]"
            placeholder={'Template variables (one per line):\nstudent_name=Ahmed\namount=1500\ndue_date=2026-05-10'}
            value={form.variablesText}
            onChange={(e) => setForm((current) => ({ ...current, variablesText: e.target.value }))}
          />
          {selectedTemplate && selectedTemplate.variables.length > 0 && (
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Expected variables: {selectedTemplate.variables.join(', ')}
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title={editingTemplateId ? 'Edit Template' : 'Create Template'}
        footer={
          <div className="flex gap-2">
            <button onClick={() => { setTemplateOpen(false); resetTemplateForm() }} className="btn-ghost flex-1 py-2 rounded-xl">Cancel</button>
            <button
              onClick={() => void handleSaveTemplate()}
              disabled={templateSaving || !templateForm.name || !templateForm.subjectTemplate || !templateForm.bodyTemplate}
              className="btn-primary flex-1 py-2 rounded-xl"
            >
              {templateSaving ? 'Saving...' : editingTemplateId ? 'Update' : 'Create'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <input className="input" placeholder="Template name" value={templateForm.name} onChange={(e) => setTemplateForm((current) => ({ ...current, name: e.target.value }))} />
          <input className="input" placeholder="Description (optional)" value={templateForm.description} onChange={(e) => setTemplateForm((current) => ({ ...current, description: e.target.value }))} />
          <div className="grid grid-cols-3 gap-3">
            <select className="input" value={templateForm.audienceType} onChange={(e) => setTemplateForm((current) => ({ ...current, audienceType: e.target.value }))}>
              <option value="ALL">All</option>
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="PARENT">Parent</option>
            </select>
            <select className="input" value={templateForm.channel} onChange={(e) => setTemplateForm((current) => ({ ...current, channel: e.target.value }))}>
              <option value="IN_APP">In-App</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
            </select>
            <select className="input" value={templateForm.status} onChange={(e) => setTemplateForm((current) => ({ ...current, status: e.target.value }))}>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <input className="input" placeholder="Subject template (e.g. Payment reminder for {{student_name}})" value={templateForm.subjectTemplate} onChange={(e) => setTemplateForm((current) => ({ ...current, subjectTemplate: e.target.value }))} />
          <textarea className="input min-h-[130px]" placeholder="Body template (e.g. Dear {{parent_name}}, outstanding amount is {{amount}} due {{due_date}}.)" value={templateForm.bodyTemplate} onChange={(e) => setTemplateForm((current) => ({ ...current, bodyTemplate: e.target.value }))} />
        </div>
      </Modal>

      <section className="card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>Communication Hub</h3>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Messages, templates, and outreach automation</p>
          </div>
          <div className="flex items-center gap-2">
            {canCompose && (
              <>
                <button onClick={() => void handleSeedDefaults()} disabled={seedingDefaults} className="btn-ghost px-4 py-2 rounded-xl text-[12px]">
                  {seedingDefaults ? 'Loading...' : 'Load Defaults'}
                </button>
                <button onClick={() => setTemplateOpen(true)} className="btn-ghost px-4 py-2 rounded-xl text-[12px]">Templates</button>
                <button onClick={() => setOpen(true)} className="btn-primary px-4 py-2 rounded-xl text-[12px]">Compose</button>
              </>
            )}
          </div>
        </div>

        {templates.length > 0 && (
          <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex flex-wrap gap-2">
              {templates.slice(0, 8).map((template) => (
                <button
                  key={template.id}
                  onClick={() => startEditTemplate(template)}
                  className={`badge ${template.status === 'ACTIVE' ? 'badge-info' : 'badge-warning'}`}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {messages.map((message) => (
            <div key={message.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{message.subject}</p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    {message.audienceType} • {message.channel} • {message.template?.name || 'Manual'} • {message.createdBy?.name || 'System'}
                  </p>
                </div>
                <span className={`badge ${message.status === 'SENT' ? 'badge-success' : message.status === 'SCHEDULED' ? 'badge-warning' : 'badge-purple'}`}>{message.status}</span>
              </div>
              <p className="text-[12px] mt-3 leading-6" style={{ color: 'var(--text-muted)' }}>{message.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
