import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import api from '../api/api'

interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
}

type RegisterFieldKey = keyof RegisterForm

interface RegisterField {
  label: string
  key: RegisterFieldKey
  type: string
  placeholder: string
}

const fields: RegisterField[] = [
  { label: 'الاسم الكامل', key: 'name', type: 'text', placeholder: 'محمد أحمد' },
  { label: 'البريد الإلكتروني', key: 'email', type: 'email', placeholder: 'example@email.com' },
  { label: 'كلمة المرور', key: 'password', type: 'password', placeholder: '********' },
  { label: 'تأكيد كلمة المرور', key: 'confirmPassword', type: 'password', placeholder: '********' },
]

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterForm>({ name: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inputsUnlocked, setInputsUnlocked] = useState(false)
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadRegistrationStatus() {
      try {
        const res = await api.get('/auth/registration-status')
        if (!mounted) return
        setRegistrationEnabled(Boolean(res.data?.registrationEnabled))
      } catch {
        if (!mounted) return
        setRegistrationEnabled(false)
      }
    }

    void loadRegistrationStatus()
    return () => {
      mounted = false
    }
  }, [])

  function unlockInputs() {
    if (!inputsUnlocked) setInputsUnlocked(true)
  }

  async function handleRegister() {
    if (registrationEnabled === false) {
      setError('Public registration is disabled. Please contact an administrator.')
      return
    }

    if (!form.name || !form.email || !form.password) {
      setError('جميع الحقول مطلوبة')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('كلمة المرور غير متطابقة')
      return
    }

    setLoading(true)
    setError('')

    try {
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      })
      navigate('/login')
    } catch (err: unknown) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message || 'فشل إنشاء الحساب'
          : 'فشل إنشاء الحساب'
      )
    } finally {
      setLoading(false)
    }
  }

  if (registrationEnabled === false) {
    return (
      <div className="min-h-screen bg-[#0D0F14] flex items-center justify-center px-4">
        <div className="w-full max-w-[380px] bg-[#111318] border border-white/[0.07] rounded-2xl p-6 text-center">
          <h1 className="text-[18px] font-semibold text-white mb-2">EduSystem</h1>
          <p className="text-[13px] text-white/70 mb-4">التسجيل العام مغلق حالياً.</p>
          <p className="text-[12px] text-white/40 mb-5">
            اطلب من مسؤول النظام إنشاء حسابك من لوحة التحكم.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full bg-violet-600 hover:bg-violet-500 transition-colors text-white text-[13px] font-medium py-2.5 rounded-xl"
          >
            الذهاب إلى تسجيل الدخول
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0F14] flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <h1 className="text-[18px] font-semibold text-white">EduSystem</h1>
          <p className="text-[12px] text-white/35 mt-1">إنشاء حساب جديد</p>
        </div>

        <form
          autoComplete="off"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void handleRegister()
          }}
          className="bg-[#111318] border border-white/[0.07] rounded-2xl p-6 flex flex-col gap-4"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              <p className="text-[12px] text-red-400 text-center">{error}</p>
            </div>
          )}

          <input type="text" name="edu_register_fake_username" autoComplete="off" tabIndex={-1} className="hidden" />
          <input type="password" name="edu_register_fake_password" autoComplete="new-password" tabIndex={-1} className="hidden" />

          {fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label className="text-[11px] text-white/40 font-medium">{field.label}</label>
              <input
                type={field.key === 'email' ? 'text' : field.type}
                name={
                  field.key === 'name'
                    ? 'edu_register_name'
                    : field.key === 'email'
                    ? 'edu_register_contact'
                    : field.key === 'password'
                    ? 'edu_register_secret'
                    : 'edu_register_secret_confirm'
                }
                value={form[field.key]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                onFocus={unlockInputs}
                placeholder={field.placeholder}
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-[13px] text-white/80 placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors"
                autoComplete={field.key === 'password' || field.key === 'confirmPassword' ? 'new-password' : 'off'}
                readOnly={!inputsUnlocked}
                inputMode={field.key === 'email' ? 'email' : undefined}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors text-white text-[13px] font-medium py-2.5 rounded-xl mt-1"
          >
            {loading ? 'جارٍ الإنشاء...' : 'إنشاء حساب'}
          </button>
        </form>

        <p className="text-center text-[12px] text-white/30 mt-4">
          لديك حساب؟{' '}
          <button onClick={() => navigate('/login')} className="text-violet-400 hover:text-violet-300 transition-colors">
            تسجيل الدخول
          </button>
        </p>
      </div>
    </div>
  )
}


