import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type Locale = 'en' | 'ar'

const messages = {
  en: {
    shell: {
      search: 'Search...',
      searchAnything: 'Search anything or run a command...',
      notifications: 'Notifications',
      notificationsSubtitle: 'Risk, payments, and performance alerts',
      noAlerts: 'No alerts right now',
      noMatches: 'No matches found',
      noResults: 'No results found',
      signOut: 'Sign out',
      language: 'AR',
      languageTitle: 'Switch to Arabic',
    },
    pages: {
      '/': { title: 'Dashboard', subtitle: 'Overview of your institution' },
      '/students': { title: 'Students', subtitle: 'Manage enrolled students' },
      '/teachers': { title: 'Teachers', subtitle: 'Faculty and staff' },
      '/attendance': { title: 'Attendance', subtitle: 'Track daily attendance' },
      '/calendar': { title: 'Calendar', subtitle: 'Classes, exams, and deadlines' },
      '/assignments': { title: 'Assignments', subtitle: 'Tasks, submissions, and grading' },
      '/payments': { title: 'Payments', subtitle: 'Fees and transactions' },
      '/reports': { title: 'Reports', subtitle: 'Analytics and insights' },
      '/teacher-performance': { title: 'Teacher Performance', subtitle: 'Scores, rankings, and snapshots' },
      '/students/profile': { title: 'Student Profile', subtitle: 'Attendance, payments, and academic summary' },
      '/automation': { title: 'Automation Builder', subtitle: 'Rules, triggers, and smart workflows' },
      '/gradebook': { title: 'Gradebook', subtitle: 'Bulk subject grading and academic control' },
      '/communications': { title: 'Communications', subtitle: 'Messages, notices, and outreach' },
      '/parents': { title: 'Parent Portal', subtitle: 'Guardians, links, and student follow-up' },
      '/audit-log': { title: 'Audit Log', subtitle: 'Tracked changes and system activity' },
      '/transcripts': { title: 'Transcripts', subtitle: 'Academic summaries ready for export' },
    },
    nav: {
      dashboard: 'Dashboard',
      students: 'Students',
      teachers: 'Teachers',
      calendar: 'Calendar',
      assignments: 'Assignments',
      attendance: 'Attendance',
      payments: 'Payments',
      reports: 'Reports',
      automation: 'Automation',
      performance: 'Performance',
      gradebook: 'Gradebook',
      communications: 'Communications',
      parents: 'Parents',
      auditLog: 'Audit Log',
      transcripts: 'Transcripts',
      navigation: 'Navigation',
      management: 'Management',
    },
    commands: {
      actions: 'Actions',
      navigate: 'Navigate',
      addStudent: 'Add Student',
      takeAttendance: 'Take Attendance',
      createAssignment: 'Create Assignment',
      openReports: 'Open Reports',
      institutionOverview: 'Institution overview',
      studentsWorkspace: 'Students workspace',
      revenueDesk: 'Revenue desk',
      deadlinesAndEvents: 'Deadlines and events',
      openStudentWorkspace: 'Open student workspace',
      openAttendanceDesk: 'Open attendance desk',
      openAssignmentsWorkspace: 'Open assignments workspace',
      viewAnalyticsAndExports: 'View analytics and exports',
    },
  },
  ar: {
    shell: {
      search: 'ابحث...',
      searchAnything: 'ابحث في النظام أو نفذ أمرًا سريعًا...',
      notifications: 'التنبيهات',
      notificationsSubtitle: 'المخاطر والمدفوعات والتنبيهات الأكاديمية',
      noAlerts: 'لا توجد تنبيهات الآن',
      noMatches: 'لا توجد نتائج مطابقة',
      noResults: 'لا توجد نتائج',
      signOut: 'تسجيل الخروج',
      language: 'EN',
      languageTitle: 'Switch to English',
    },
    pages: {
      '/': { title: 'لوحة التحكم', subtitle: 'نظرة عامة على المؤسسة' },
      '/students': { title: 'الطلاب', subtitle: 'إدارة الطلاب المسجلين' },
      '/teachers': { title: 'المعلمون', subtitle: 'إدارة الكادر التعليمي' },
      '/attendance': { title: 'الحضور', subtitle: 'متابعة الحضور اليومي' },
      '/calendar': { title: 'التقويم', subtitle: 'الحصص والاختبارات والمواعيد' },
      '/assignments': { title: 'الواجبات', subtitle: 'المهام والتسليم والتقييم' },
      '/payments': { title: 'المدفوعات', subtitle: 'الرسوم والحركات المالية' },
      '/reports': { title: 'التقارير', subtitle: 'التحليلات والرؤى' },
      '/teacher-performance': { title: 'أداء المعلمين', subtitle: 'الدرجات والترتيب واللقطات' },
      '/students/profile': { title: 'ملف الطالب', subtitle: 'الحضور والمدفوعات والملخص الأكاديمي' },
      '/automation': { title: 'الأتمتة', subtitle: 'القواعد والمحفزات وسير العمل الذكي' },
      '/gradebook': { title: 'دفتر الدرجات', subtitle: 'إدخال جماعي للدرجات وإدارة المواد' },
      '/communications': { title: 'مركز الرسائل', subtitle: 'الإشعارات والرسائل والتواصل' },
      '/parents': { title: 'بوابة أولياء الأمور', subtitle: 'الأهالي وربط الطلاب والمتابعة' },
      '/audit-log': { title: 'سجل التغييرات', subtitle: 'تتبع العمليات والتعديلات في النظام' },
      '/transcripts': { title: 'كشوف الدرجات', subtitle: 'ملخصات أكاديمية جاهزة للطباعة' },
    },
    nav: {
      dashboard: 'لوحة التحكم',
      students: 'الطلاب',
      teachers: 'المعلمون',
      calendar: 'التقويم',
      assignments: 'الواجبات',
      attendance: 'الحضور',
      payments: 'المدفوعات',
      reports: 'التقارير',
      automation: 'الأتمتة',
      performance: 'الأداء',
      gradebook: 'دفتر الدرجات',
      communications: 'الرسائل',
      parents: 'الأهالي',
      auditLog: 'سجل التغييرات',
      transcripts: 'كشوف الدرجات',
      navigation: 'التنقل',
      management: 'الإدارة',
    },
    commands: {
      actions: 'إجراءات',
      navigate: 'تنقل',
      addStudent: 'إضافة طالب',
      takeAttendance: 'تسجيل الحضور',
      createAssignment: 'إنشاء واجب',
      openReports: 'فتح التقارير',
      institutionOverview: 'نظرة عامة على المؤسسة',
      studentsWorkspace: 'مساحة عمل الطلاب',
      revenueDesk: 'إدارة التحصيل',
      deadlinesAndEvents: 'المواعيد والأحداث',
      openStudentWorkspace: 'افتح مساحة الطلاب',
      openAttendanceDesk: 'افتح صفحة الحضور',
      openAssignmentsWorkspace: 'افتح صفحة الواجبات',
      viewAnalyticsAndExports: 'استعرض التحليلات والتصدير',
    },
  },
} as const

type MessageTree = (typeof messages)[Locale]

interface LocaleContextType {
  locale: Locale
  isRtl: boolean
  toggleLocale: () => void
  setLocale: (locale: Locale) => void
  text: MessageTree
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'en',
  isRtl: false,
  toggleLocale: () => {},
  setLocale: () => {},
  text: messages.en,
})

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = window.localStorage.getItem('edu-locale')
    return saved === 'ar' ? 'ar' : 'en'
  })

  useEffect(() => {
    const root = document.documentElement
    root.lang = locale
    root.dir = locale === 'ar' ? 'rtl' : 'ltr'
    window.localStorage.setItem('edu-locale', locale)
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
  }, [])

  const toggleLocale = useCallback(() => {
    setLocaleState((current) => (current === 'ar' ? 'en' : 'ar'))
  }, [])

  const value = useMemo(
    () => ({
      locale,
      isRtl: locale === 'ar',
      toggleLocale,
      setLocale,
      text: messages[locale],
    }),
    [locale, setLocale, toggleLocale]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  return useContext(LocaleContext)
}
