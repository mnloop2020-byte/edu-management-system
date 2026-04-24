const ARABIC_LABEL_MAP: Array<[string, string]> = [
  ['software requirements', '\u0645\u062a\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0628\u0631\u0645\u062c\u064a\u0627\u062a'],
  ['software requirement', '\u0645\u062a\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0628\u0631\u0645\u062c\u064a\u0627\u062a'],
  ['softwarerequirements', '\u0645\u062a\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0628\u0631\u0645\u062c\u064a\u0627\u062a'],
  ['softwarerequirement', '\u0645\u062a\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0628\u0631\u0645\u062c\u064a\u0627\u062a'],
  ['softwar', '\u0645\u062a\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0628\u0631\u0645\u062c\u064a\u0627\u062a'],
  ['software', '\u0627\u0644\u0628\u0631\u0645\u062c\u064a\u0627\u062a'],
  ['front end', '\u062a\u0637\u0648\u064a\u0631 \u0627\u0644\u0648\u0627\u062c\u0647\u0627\u062a'],
  ['frontend', '\u062a\u0637\u0648\u064a\u0631 \u0627\u0644\u0648\u0627\u062c\u0647\u0627\u062a'],
  ['database', '\u0642\u0648\u0627\u0639\u062f \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a'],
  ['math', '\u0627\u0644\u0631\u064a\u0627\u0636\u064a\u0627\u062a'],
  ['mathematics', '\u0627\u0644\u0631\u064a\u0627\u0636\u064a\u0627\u062a'],
  ['science', '\u0627\u0644\u0639\u0644\u0648\u0645'],
]

const normalizeForLookup = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^course[-_\s]*/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')

const normalizeCompact = (value: string) =>
  normalizeForLookup(value).replace(/[^a-z0-9\u0600-\u06ff]/g, '')

function mapToArabic(value: string) {
  const normalized = normalizeForLookup(value)
  const compact = normalizeCompact(value)

  for (const [key, arabic] of ARABIC_LABEL_MAP) {
    const keyNormalized = normalizeForLookup(key)
    const keyCompact = normalizeCompact(key)
    if (
      normalized === keyNormalized ||
      compact === keyCompact ||
      normalized.includes(keyNormalized) ||
      compact.includes(keyCompact)
    ) {
      return arabic
    }
  }

  return null
}

export function localizeAcademicLabel(value: string | null | undefined, locale: 'ar' | 'en') {
  const raw = String(value || '').trim()
  if (!raw) return raw
  if (locale !== 'ar') return raw

  const mapped = mapToArabic(raw)
  if (mapped) return mapped

  if (/^course[-_\s]/i.test(raw)) {
    const normalized = normalizeForLookup(raw)
    const remapped = mapToArabic(normalized)
    if (remapped) return remapped
    return normalized.toUpperCase()
  }

  return raw
}

export function localizeAcademicCode(value: string | null | undefined, locale: 'ar' | 'en') {
  const raw = String(value || '').trim()
  if (!raw) return raw
  if (locale !== 'ar') return raw

  const mapped = mapToArabic(raw)
  if (mapped) return mapped

  const withoutPrefix = raw.replace(/^course[-_\s]*/i, '').replace(/[_-]+/g, ' ').trim()
  return withoutPrefix || raw
}

export function localizeAcademicText(value: string | null | undefined, locale: 'ar' | 'en') {
  const raw = String(value || '')
  if (!raw || locale !== 'ar') return raw

  let result = raw
  const courseCodeMatches = [...result.matchAll(/\bCOURSE[-_A-Z0-9]+\b/gi)].map((match) => match[0])
  for (const code of new Set(courseCodeMatches)) {
    result = result.replaceAll(code, localizeAcademicCode(code, locale))
  }

  for (const [source, target] of ARABIC_LABEL_MAP) {
    const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(escaped, 'gi')
    result = result.replace(pattern, target)
  }

  return result
}

function localizeAssessmentLabel(value: string, locale: 'ar' | 'en') {
  if (locale !== 'ar') return value

  const normalized = normalizeToken(value)
  const labels: Record<string, string> = {
    MIDTERM: 'الميدترم',
    FINAL_EXAM: 'الاختبار النهائي',
    FINAL: 'الاختبار النهائي',
    WORK: 'أعمال الفصل',
    COURSEWORK: 'أعمال الفصل',
    QUIZ: 'اختبار قصير',
    GPA: 'المعدل',
  }

  return labels[normalized] || localizeAcademicLabel(value, locale)
}

const ACTION_AR_MAP: Record<string, string> = {
  CREATE: '\u0625\u0646\u0634\u0627\u0621',
  UPDATE: '\u062a\u062d\u062f\u064a\u062b',
  DELETE: '\u062d\u0630\u0641',
  ASSIGN: '\u0625\u0633\u0646\u0627\u062f',
  UNASSIGN: '\u0625\u0644\u063a\u0627\u0621 \u0625\u0633\u0646\u0627\u062f',
  RECORD: '\u062a\u0633\u062c\u064a\u0644',
  RECALCULATE: '\u0625\u0639\u0627\u062f\u0629 \u062d\u0633\u0627\u0628',
}

const ENTITY_AR_MAP: Record<string, string> = {
  STUDENT: '\u0637\u0627\u0644\u0628',
  TEACHER: '\u0645\u0639\u0644\u0645',
  SUBJECT: '\u0645\u0627\u062f\u0629',
  OFFERING: '\u0637\u0631\u062d \u0623\u0643\u0627\u062f\u064a\u0645\u064a',
  ENROLLMENT: '\u062a\u0633\u062c\u064a\u0644 \u0645\u0627\u062f\u0629',
  ATTENDANCE: '\u062d\u0636\u0648\u0631',
  PAYMENT: '\u062f\u0641\u0639\u0629',
  ASSIGNMENT: '\u0648\u0627\u062c\u0628',
  GRADE: '\u062f\u0631\u062c\u0629',
  GRADEBOOK: '\u062f\u0641\u062a\u0631 \u0627\u0644\u062f\u0631\u062c\u0627\u062a',
  REPORT: '\u062a\u0642\u0631\u064a\u0631',
}

function normalizeToken(value: string) {
  return String(value || '')
    .trim()
    .replace(/[\s-]+/g, '_')
    .toUpperCase()
}

export function localizeAuditAction(value: string | null | undefined, locale: 'ar' | 'en') {
  const raw = String(value || '').trim()
  if (!raw || locale !== 'ar') return raw

  const token = normalizeToken(raw)
  return ACTION_AR_MAP[token] || raw
}

export function localizeAuditEntity(value: string | null | undefined, locale: 'ar' | 'en') {
  const raw = String(value || '').trim()
  if (!raw || locale !== 'ar') return raw

  const token = normalizeToken(raw)
  return ENTITY_AR_MAP[token] || localizeAcademicLabel(raw, locale)
}

export function localizeAuditSummary(value: string | null | undefined, locale: 'ar' | 'en') {
  const raw = String(value || '').trim()
  if (!raw || locale !== 'ar') return raw

  let result = localizeAcademicText(raw, locale)

  result = result.replace(/^Created teacher (.+)$/i, 'تم إنشاء المعلم $1')
  result = result.replace(/^Updated teacher (.+)$/i, 'تم تحديث المعلم $1')
  result = result.replace(/^Deleted teacher (.+)$/i, 'تم حذف المعلم $1')
  result = result.replace(/^Created student (.+)$/i, 'تم إنشاء الطالب $1')
  result = result.replace(/^Updated student (.+)$/i, 'تم تحديث الطالب $1')
  result = result.replace(/^Deleted student (.+)$/i, 'تم حذف الطالب $1')
  result = result.replace(/^Created subject (.+)$/i, 'تم إنشاء المادة $1')
  result = result.replace(/^Updated subject (.+)$/i, 'تم تحديث المادة $1')
  result = result.replace(/^Deleted subject (.+)$/i, 'تم حذف المادة $1')
  result = result.replace(/^Created semester (.+)$/i, 'تم إنشاء الفصل الدراسي $1')
  result = result.replace(/^Updated semester (.+)$/i, 'تم تحديث الفصل الدراسي $1')
  result = result.replace(/^Seeded default communication templates$/i, 'تم تحميل قوالب التواصل الجاهزة')
  result = result.replace(/^Created communication template (.+)$/i, 'تم إنشاء قالب تواصل $1')
  result = result.replace(/^Updated communication template (.+)$/i, 'تم تحديث قالب التواصل $1')
  result = result.replace(/^Deleted communication template (.+)$/i, 'تم حذف قالب التواصل $1')
  result = result.replace(/^Created communication (.+)$/i, 'تم إنشاء رسالة $1')
  result = result.replace(/^Updated payment for student (.+)$/i, 'تم تحديث دفعة الطالب $1')
  result = result.replace(/^Created payment for student (.+)$/i, 'تم إنشاء دفعة للطالب $1')

  result = result.replace(
    /^Updated ([A-Z_]+) score for enrollment (\d+)$/i,
    (_, assessment, enrollmentId) => `تم تحديث درجة ${localizeAssessmentLabel(assessment, locale)} للتسجيل رقم ${enrollmentId}`,
  )

  result = result.replace(
    /^Recalculated ([A-Z_]+) for enrollment (\d+)$/i,
    (_, assessment, enrollmentId) => `تمت إعادة حساب ${localizeAssessmentLabel(assessment, locale)} للتسجيل رقم ${enrollmentId}`,
  )

  result = result.replace(
    /^Bulk updated gradebook for (.+)$/i,
    (_, target) => `تم تحديث دفتر الدرجات جماعيًا لـ ${localizeAcademicText(target, locale)}`,
  )

  return result
}
