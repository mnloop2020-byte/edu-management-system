import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../hooks/useLocale'
import api from '../api/api'

export default function Login() {
  const { login } = useAuth()
  const { locale, isRtl } = useLocale()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [canRegister, setCanRegister] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadRegistrationStatus() {
      try {
        const res = await api.get('/auth/registration-status')
        if (!mounted) return
        setCanRegister(Boolean(res.data?.registrationEnabled))
      } catch {
        if (!mounted) return
        setCanRegister(false)
      }
    }

    void loadRegistrationStatus()
    return () => {
      mounted = false
    }
  }, [])

  const copy = locale === 'ar'
    ? {
        panelTag: 'إدارة تعليمية ذكية',
        panelTitle: 'أدر مدرستك',
        panelAccent: 'بكفاءة أعلى',
        panelDesc: 'تابع الطلاب والمعلمين والحضور والمدفوعات من شاشة دخول واضحة وسريعة.',
        features: ['التحليلات', 'الطلاب', 'الحضور', 'المدفوعات', 'الذكاء الاصطناعي'],
        testimonial: 'ساعدنا النظام في تنظيم العمل اليومي ومتابعة الأداء بسرعة أكبر.',
        role: 'مدير مدرسة',
        title: 'مرحبًا بعودتك',
        subtitle: 'سجّل الدخول للمتابعة',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        emailPlaceholder: 'you@example.com',
        passwordPlaceholder: '••••••••',
        submit: 'تسجيل الدخول',
        submitLoading: 'جارٍ تسجيل الدخول...',
        missingFields: 'يرجى تعبئة جميع الحقول',
        invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        noAccount: 'ليس لديك حساب؟',
        createAccount: 'إنشاء حساب',
      }
    : {
        panelTag: 'Smart Education Management',
        panelTitle: 'Manage your school',
        panelAccent: 'with more clarity',
        panelDesc: 'Track students, teachers, attendance, and payments from a fast, focused sign-in experience.',
        features: ['Analytics', 'Students', 'Attendance', 'Payments', 'AI'],
        testimonial: 'The system helped us organize daily work and monitor performance much faster.',
        role: 'School Principal',
        title: 'Welcome back',
        subtitle: 'Sign in to continue',
        email: 'Email address',
        password: 'Password',
        emailPlaceholder: 'you@example.com',
        passwordPlaceholder: '••••••••',
        submit: 'Sign in',
        submitLoading: 'Signing in...',
        missingFields: 'Please fill in all fields',
        invalidCredentials: 'Invalid email or password',
        noAccount: "Don't have an account?",
        createAccount: 'Create account',
      }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError(copy.missingFields)
      return
    }

    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err: unknown) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message || copy.invalidCredentials
          : copy.invalidCredentials
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <div
        className="hidden lg:flex flex-col justify-between w-[46%] p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f0a2a 0%, #1a1040 50%, #0D0F12 100%)',
          borderRight: isRtl ? 'none' : '1px solid rgba(255,255,255,0.06)',
          borderLeft: isRtl ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
        <div style={{ position: 'absolute', top: '15%', right: isRtl ? 'auto' : '-10%', left: isRtl ? '-10%' : 'auto', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 65%)' }} />

        <div className="relative flex items-center gap-3">
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 17, color: '#e2e0ff', letterSpacing: '-0.02em' }}>EduSystem</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{copy.panelTag}</p>
          </div>
        </div>

        <div className="relative">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 99, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', fontSize: 11, color: '#a78bfa', fontWeight: 600, marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }} />
            {copy.panelTag}
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', fontWeight: 800, color: '#f0eeff', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 16 }}>
            {copy.panelTitle}<br />
            <span className="gradient-text">{copy.panelAccent}</span>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.42)', lineHeight: 1.8, maxWidth: 380 }}>
            {copy.panelDesc}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
            {copy.features.map((feature) => (
              <span key={feature} style={{ padding: '5px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                {feature}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 20px' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, fontStyle: 'italic' }}>
              "{copy.testimonial}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>AH</div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Ahmed Hassan</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{copy.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-[400px]">
          <div className="flex lg:hidden flex-col items-center mb-8 gap-3">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>EduSystem</h1>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h2 className="text-[26px] font-bold leading-tight" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>{copy.title}</h2>
            <p className="text-[14px] mt-1.5" style={{ color: 'var(--text-muted)' }}>{copy.subtitle}</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-5" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-[13px]" style={{ color: '#f87171' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" autoComplete="off" noValidate>
            <input type="text" name="edu_fake_username" autoComplete="off" tabIndex={-1} className="hidden" />
            <input type="password" name="edu_fake_password" autoComplete="new-password" tabIndex={-1} className="hidden" />
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{copy.email}</label>
              <input
                type="email"
                name="edu_email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder={copy.emailPlaceholder}
                className="input"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{copy.password}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="edu_password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={copy.passwordPlaceholder}
                  className="input"
                  style={{ paddingRight: isRtl ? 14 : 44, paddingLeft: isRtl ? 44 : 14 }}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', border: 'none', background: 'none', cursor: 'pointer', padding: 0, right: isRtl ? 'auto' : 12, left: isRtl ? 12 : 'auto' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[14px] mt-1 flex items-center justify-center gap-2" style={{ borderRadius: 12 }}>
              {loading ? copy.submitLoading : copy.submit}
            </button>
          </form>

          {canRegister && (
            <p className="text-center text-[13px] mt-6" style={{ color: 'var(--text-muted)' }}>
              {copy.noAccount}{' '}
              <button
                onClick={() => navigate('/register')}
                className="font-semibold transition-colors"
                style={{ color: 'var(--accent-light)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {copy.createAccount}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
