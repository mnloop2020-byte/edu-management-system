import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import { Modal } from '../components/ui/Modal'
import { toast } from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../hooks/useLocale'
import { EmptyState } from '../components/ui/EmptyState'

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

function getCopy(locale: 'ar' | 'en') {
  return locale === 'ar'
    ? {
        noMessagesTitle: 'لا توجد رسائل بعد',
        noMessagesMessage: 'ابدأ بإنشاء رسالة جديدة لتظهر هنا.',
        createMessage: 'إنشاء رسالة',
        composeMessage: 'إنشاء رسالة',
        editTemplate: 'تعديل القالب',
        createTemplate: 'إنشاء قالب',
        cancel: 'إلغاء',
        saving: 'جارٍ الحفظ...',
        sendOrSave: 'إرسال / حفظ',
        noTemplate: 'بدون قالب',
        applyTemplate: 'تطبيق القالب',
        subject: 'العنوان',
        messageBody: 'محتوى الرسالة',
        all: 'الكل',
        student: 'طالب',
        teacher: 'معلم',
        parent: 'ولي أمر',
        inApp: 'داخل النظام',
        email: 'البريد الإلكتروني',
        sms: 'رسالة نصية',
        draft: 'مسودة',
        sent: 'مرسلة',
        scheduled: 'مجدولة',
        active: 'نشط',
        archived: 'مؤرشف',
        selectStudent: 'اختر الطالب',
        selectTeacher: 'اختر المعلم',
        selectParent: 'اختر ولي الأمر',
        templateVariablesPlaceholder: 'متغيرات القالب، سطر لكل قيمة:\nstudent_name=أحمد\namount=1500\ndue_date=2026-05-10',
        expectedVariables: 'المتغيرات المطلوبة',
        update: 'تحديث',
        create: 'إنشاء',
        templateName: 'اسم القالب',
        descriptionOptional: 'الوصف (اختياري)',
        subjectTemplatePlaceholder: 'مثال: تذكير برسوم الطالب {{student_name}}',
        bodyTemplatePlaceholder: 'مثال: عزيزي {{parent_name}}، المبلغ المستحق {{amount}} وتاريخ الاستحقاق {{due_date}}.',
        communicationHub: 'مركز الرسائل',
        communicationSubtitle: 'الإشعارات والرسائل والتواصل',
        loading: 'جارٍ التحميل...',
        loadDefaults: 'تحميل القوالب الجاهزة',
        templates: 'القوالب',
        compose: 'إنشاء',
        manual: 'يدوي',
        system: 'النظام',
        templateApplied: 'تم تطبيق القالب بنجاح',
        applyTemplateFailed: 'تعذر تطبيق القالب',
        communicationCreated: 'تم إنشاء الرسالة بنجاح',
        createCommunicationFailed: 'تعذر إنشاء الرسالة',
        templateUpdated: 'تم تحديث القالب',
        templateCreated: 'تم إنشاء القالب',
        saveTemplateFailed: 'تعذر حفظ القالب',
        loadDefaultsFailed: 'تعذر تحميل القوالب الجاهزة',
        missingVariables: 'متغيرات ناقصة',
        defaultsLoadedSummary: (created: number, skipped: number) => `تم تحميل القوالب الجاهزة: ${created} جديد، ${skipped} متخطى`,
      }
    : {
        noMessagesTitle: 'No messages yet',
        noMessagesMessage: 'Create a new message to see it here.',
        createMessage: 'Create Message',
        composeMessage: 'Compose Message',
        editTemplate: 'Edit Template',
        createTemplate: 'Create Template',
        cancel: 'Cancel',
        saving: 'Saving...',
        sendOrSave: 'Send / Save',
        noTemplate: 'No template',
        applyTemplate: 'Apply Template',
        subject: 'Subject',
        messageBody: 'Message body',
        all: 'All',
        student: 'Student',
        teacher: 'Teacher',
        parent: 'Parent',
        inApp: 'In-App',
        email: 'Email',
        sms: 'SMS',
        draft: 'Draft',
        sent: 'Sent',
        scheduled: 'Scheduled',
        active: 'Active',
        archived: 'Archived',
        selectStudent: 'Select student',
        selectTeacher: 'Select teacher',
        selectParent: 'Select parent',
        templateVariablesPlaceholder: 'Template variables (one per line):\nstudent_name=Ahmed\namount=1500\ndue_date=2026-05-10',
        expectedVariables: 'Expected variables',
        update: 'Update',
        create: 'Create',
        templateName: 'Template name',
        descriptionOptional: 'Description (optional)',
        subjectTemplatePlaceholder: 'Subject template (e.g. Payment reminder for {{student_name}})',
        bodyTemplatePlaceholder: 'Body template (e.g. Dear {{parent_name}}, outstanding amount is {{amount}} due {{due_date}}.)',
        communicationHub: 'Communication Hub',
        communicationSubtitle: 'Messages, templates, and outreach automation',
        loading: 'Loading...',
        loadDefaults: 'Load Defaults',
        templates: 'Templates',
        compose: 'Compose',
        manual: 'Manual',
        system: 'System',
        templateApplied: 'Template applied successfully',
        applyTemplateFailed: 'Failed to apply template',
        communicationCreated: 'Communication created',
        createCommunicationFailed: 'Failed to create communication',
        templateUpdated: 'Template updated',
        templateCreated: 'Template created',
        saveTemplateFailed: 'Failed to save template',
        loadDefaultsFailed: 'Failed to load default templates',
        missingVariables: 'Missing variables',
        defaultsLoadedSummary: (created: number, skipped: number) => `Loaded defaults: ${created} created, ${skipped} skipped`,
      }
}

function localizeAudienceLabel(audienceType: Communication['audienceType'], locale: 'ar' | 'en') {
  if (locale === 'ar') {
    if (audienceType === 'STUDENT') return 'طالب'
    if (audienceType === 'TEACHER') return 'معلم'
    if (audienceType === 'PARENT') return 'ولي أمر'
    return 'الكل'
  }

  if (audienceType === 'STUDENT') return 'Student'
  if (audienceType === 'TEACHER') return 'Teacher'
  if (audienceType === 'PARENT') return 'Parent'
  return 'All'
}

function localizeChannelLabel(channel: Communication['channel'], locale: 'ar' | 'en') {
  if (locale === 'ar') {
    if (channel === 'EMAIL') return 'البريد الإلكتروني'
    if (channel === 'SMS') return 'رسالة نصية'
    return 'داخل النظام'
  }

  if (channel === 'EMAIL') return 'Email'
  if (channel === 'SMS') return 'SMS'
  return 'In-App'
}

function localizeStatusLabel(
  status: Communication['status'] | CommunicationTemplate['status'],
  locale: 'ar' | 'en',
) {
  if (locale === 'ar') {
    if (status === 'SENT') return 'مرسلة'
    if (status === 'SCHEDULED') return 'مجدولة'
    if (status === 'ACTIVE') return 'نشط'
    if (status === 'ARCHIVED') return 'مؤرشف'
    return 'مسودة'
  }

  if (status === 'SENT') return 'Sent'
  if (status === 'SCHEDULED') return 'Scheduled'
  if (status === 'ACTIVE') return 'Active'
  if (status === 'ARCHIVED') return 'Archived'
  return 'Draft'
}

function localizeTemplateName(name: string, locale: 'ar' | 'en') {
  if (locale !== 'ar') return name

  const labels: Record<string, string> = {
    'Attendance Warning': 'تنبيه غياب',
    'Payment Overdue Reminder': 'تذكير برسوم متأخرة',
    'Upcoming Exam Notice': 'إشعار اختبار قادم',
    'Academic Excellence': 'تفوق أكاديمي',
  }

  return labels[name] ?? name
}

export default function Communications() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const copy = getCopy(locale)
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
    status: 'SENT',
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

  const activeTemplates = useMemo(
    () => templates.filter((template) => template.status === 'ACTIVE'),
    [templates],
  )

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

  const loadData = useCallback(async () => {
    if (!canCompose) {
      const messagesRes = await api.get('/communications')
      setMessages(messagesRes.data.messages ?? [])
      setTemplates([])
      setStudents([])
      setTeachers([])
      setParents([])
      return
    }

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
  }, [canCompose])

  useEffect(() => {
    void loadData()
  }, [loadData])

  function resetComposeForm() {
    setForm({
      templateId: '',
      subject: '',
      body: '',
      audienceType: 'ALL',
      channel: 'IN_APP',
      status: 'SENT',
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
        toast.error(`${copy.missingVariables}: ${missingVariables.join(', ')}`)
      } else {
        toast.success(copy.templateApplied)
      }
    } catch {
      toast.error(copy.applyTemplateFailed)
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
      toast.success(copy.communicationCreated)
    } catch {
      toast.error(copy.createCommunicationFailed)
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
        toast.success(copy.templateUpdated)
      } else {
        await api.post('/communications/templates', payload)
        toast.success(copy.templateCreated)
      }

      resetTemplateForm()
      await loadData()
    } catch {
      toast.error(copy.saveTemplateFailed)
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
      toast.success(copy.defaultsLoadedSummary(result?.created ?? 0, result?.skipped ?? 0))
    } catch {
      toast.error(copy.loadDefaultsFailed)
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
        title={copy.composeMessage}
        footer={(
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="btn-ghost flex-1 rounded-xl py-2">{copy.cancel}</button>
            <button
              onClick={() => void handleCreateCommunication()}
              disabled={saving || !form.subject || !form.body}
              className="btn-primary flex-1 rounded-xl py-2"
            >
              {saving ? copy.saving : copy.sendOrSave}
            </button>
          </div>
        )}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <select
              className="input"
              value={form.templateId}
              onChange={(e) => setForm((current) => ({ ...current, templateId: e.target.value }))}
            >
              <option value="">{copy.noTemplate}</option>
              {activeTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {localizeTemplateName(template.name, locale)}
                </option>
              ))}
            </select>
            <button
              onClick={() => void handleApplyTemplate()}
              disabled={!form.templateId}
              className="btn-ghost rounded-xl px-4 py-2 text-[12px]"
            >
              {copy.applyTemplate}
            </button>
          </div>

          <input
            className="input"
            placeholder={copy.subject}
            value={form.subject}
            onChange={(e) => setForm((current) => ({ ...current, subject: e.target.value }))}
          />

          <textarea
            className="input min-h-[120px]"
            placeholder={copy.messageBody}
            value={form.body}
            onChange={(e) => setForm((current) => ({ ...current, body: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <select
              className="input"
              value={form.audienceType}
              onChange={(e) => setForm((current) => ({
                ...current,
                audienceType: e.target.value,
                recipientStudentId: '',
                recipientTeacherId: '',
                recipientParentId: '',
              }))}
            >
              <option value="ALL">{copy.all}</option>
              <option value="STUDENT">{copy.student}</option>
              <option value="TEACHER">{copy.teacher}</option>
              <option value="PARENT">{copy.parent}</option>
            </select>

            <select
              className="input"
              value={form.channel}
              onChange={(e) => setForm((current) => ({ ...current, channel: e.target.value }))}
            >
              <option value="IN_APP">{copy.inApp}</option>
              <option value="EMAIL">{copy.email}</option>
              <option value="SMS">{copy.sms}</option>
            </select>

            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}
            >
              <option value="DRAFT">{copy.draft}</option>
              <option value="SENT">{copy.sent}</option>
              <option value="SCHEDULED">{copy.scheduled}</option>
            </select>

            {form.audienceType === 'STUDENT' && (
              <select
                className="input"
                value={form.recipientStudentId}
                onChange={(e) => setForm((current) => ({ ...current, recipientStudentId: e.target.value }))}
              >
                <option value="">{copy.selectStudent}</option>
                {students.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            )}

            {form.audienceType === 'TEACHER' && (
              <select
                className="input"
                value={form.recipientTeacherId}
                onChange={(e) => setForm((current) => ({ ...current, recipientTeacherId: e.target.value }))}
              >
                <option value="">{copy.selectTeacher}</option>
                {teachers.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            )}

            {form.audienceType === 'PARENT' && (
              <select
                className="input"
                value={form.recipientParentId}
                onChange={(e) => setForm((current) => ({ ...current, recipientParentId: e.target.value }))}
              >
                <option value="">{copy.selectParent}</option>
                {parents.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            )}
          </div>

          <textarea
            className="input min-h-[92px]"
            placeholder={copy.templateVariablesPlaceholder}
            value={form.variablesText}
            onChange={(e) => setForm((current) => ({ ...current, variablesText: e.target.value }))}
          />

          {selectedTemplate && selectedTemplate.variables.length > 0 && (
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {copy.expectedVariables}: {selectedTemplate.variables.join(', ')}
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title={editingTemplateId ? copy.editTemplate : copy.createTemplate}
        footer={(
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTemplateOpen(false)
                resetTemplateForm()
              }}
              className="btn-ghost flex-1 rounded-xl py-2"
            >
              {copy.cancel}
            </button>
            <button
              onClick={() => void handleSaveTemplate()}
              disabled={templateSaving || !templateForm.name || !templateForm.subjectTemplate || !templateForm.bodyTemplate}
              className="btn-primary flex-1 rounded-xl py-2"
            >
              {templateSaving ? copy.saving : editingTemplateId ? copy.update : copy.create}
            </button>
          </div>
        )}
      >
        <div className="space-y-3">
          <input
            className="input"
            placeholder={copy.templateName}
            value={templateForm.name}
            onChange={(e) => setTemplateForm((current) => ({ ...current, name: e.target.value }))}
          />

          <input
            className="input"
            placeholder={copy.descriptionOptional}
            value={templateForm.description}
            onChange={(e) => setTemplateForm((current) => ({ ...current, description: e.target.value }))}
          />

          <div className="grid grid-cols-3 gap-3">
            <select
              className="input"
              value={templateForm.audienceType}
              onChange={(e) => setTemplateForm((current) => ({ ...current, audienceType: e.target.value }))}
            >
              <option value="ALL">{copy.all}</option>
              <option value="STUDENT">{copy.student}</option>
              <option value="TEACHER">{copy.teacher}</option>
              <option value="PARENT">{copy.parent}</option>
            </select>

            <select
              className="input"
              value={templateForm.channel}
              onChange={(e) => setTemplateForm((current) => ({ ...current, channel: e.target.value }))}
            >
              <option value="IN_APP">{copy.inApp}</option>
              <option value="EMAIL">{copy.email}</option>
              <option value="SMS">{copy.sms}</option>
            </select>

            <select
              className="input"
              value={templateForm.status}
              onChange={(e) => setTemplateForm((current) => ({ ...current, status: e.target.value }))}
            >
              <option value="ACTIVE">{copy.active}</option>
              <option value="ARCHIVED">{copy.archived}</option>
            </select>
          </div>

          <input
            className="input"
            placeholder={copy.subjectTemplatePlaceholder}
            value={templateForm.subjectTemplate}
            onChange={(e) => setTemplateForm((current) => ({ ...current, subjectTemplate: e.target.value }))}
          />

          <textarea
            className="input min-h-[130px]"
            placeholder={copy.bodyTemplatePlaceholder}
            value={templateForm.bodyTemplate}
            onChange={(e) => setTemplateForm((current) => ({ ...current, bodyTemplate: e.target.value }))}
          />
        </div>
      </Modal>

      <section className="card overflow-hidden">
        <div
          className="flex items-center justify-between gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h3 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{copy.communicationHub}</h3>
            <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.communicationSubtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            {canCompose && (
              <>
                <button
                  onClick={() => void handleSeedDefaults()}
                  disabled={seedingDefaults}
                  className="btn-ghost rounded-xl px-4 py-2 text-[12px]"
                >
                  {seedingDefaults ? copy.loading : copy.loadDefaults}
                </button>
                <button onClick={() => setTemplateOpen(true)} className="btn-ghost rounded-xl px-4 py-2 text-[12px]">
                  {copy.templates}
                </button>
                <button onClick={() => setOpen(true)} className="btn-primary rounded-xl px-4 py-2 text-[12px]">
                  {copy.compose}
                </button>
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
                  {localizeTemplateName(template.name, locale)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {messages.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState
                title={copy.noMessagesTitle}
                message={copy.noMessagesMessage}
                action={canCompose ? { label: copy.createMessage, onClick: () => setOpen(true) } : undefined}
              />
            </div>
          ) : messages.map((message) => (
            <div key={message.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{message.subject}</p>
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {localizeAudienceLabel(message.audienceType, locale)} • {localizeChannelLabel(message.channel, locale)} • {message.template?.name ? localizeTemplateName(message.template.name, locale) : copy.manual} • {message.createdBy?.name || copy.system}
                  </p>
                </div>
                <span className={`badge ${message.status === 'SENT' ? 'badge-success' : message.status === 'SCHEDULED' ? 'badge-warning' : 'badge-purple'}`}>
                  {localizeStatusLabel(message.status, locale)}
                </span>
              </div>
              <p className="mt-3 text-[12px] leading-6" style={{ color: 'var(--text-muted)' }}>{message.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
