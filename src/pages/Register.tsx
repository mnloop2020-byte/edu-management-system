import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/api'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister() {
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل إنشاء الحساب')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0F14] flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">

        {/* Logo */}
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

        {/* Card */}
        <div className="bg-[#111318] border border-white/[0.07] rounded-2xl p-6 flex flex-col gap-4">

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              <p className="text-[12px] text-red-400 text-center">{error}</p>
            </div>
          )}

          {[
            { label: 'الاسم الكامل', key: 'name', type: 'text', placeholder: 'محمد أحمد' },
            { label: 'البريد الإلكتروني', key: 'email', type: 'email', placeholder: 'example@email.com' },
            { label: 'كلمة المرور', key: 'password', type: 'password', placeholder: '••••••••' },
            { label: 'تأكيد كلمة المرور', key: 'confirmPassword', type: 'password', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="text-[11px] text-white/40 font-medium">{f.label}</label>
              <input
                type={f.type}
                value={(form as any)[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-[13px] text-white/80 placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          ))}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors text-white text-[13px] font-medium py-2.5 rounded-xl mt-1"
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء حساب'}
          </button>

        </div>

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
