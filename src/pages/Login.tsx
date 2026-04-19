import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) { setError('Please fill in all fields'); return }
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err: unknown) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message || 'Invalid email or password'
          : 'Invalid email or password'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--bg, #0D0F12)', fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Left panel (illustration) ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[46%] p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f0a2a 0%, #1a1040 50%, #0D0F12 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Grid bg */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }} />
        {/* Glow orb */}
        <div style={{ position: 'absolute', top: '15%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-5%',  width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 65%)',  pointerEvents: 'none' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3 animate-fade-in">
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 17, color: '#e2e0ff', letterSpacing: '-0.02em' }}>EduSystem</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Management Platform</p>
          </div>
        </div>

        {/* Center text */}
        <div className="relative animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 99, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', fontSize: 11, color: '#a78bfa', fontWeight: 600, marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', display: 'inline-block', animation: 'pulseDot 2s infinite' }} />
            Smart Education Management
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', fontWeight: 800, color: '#f0eeff', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Manage your school<br/>
            <span className="gradient-text">intelligently.</span>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.42)', lineHeight: 1.8, maxWidth: 380 }}>
            Track students, teachers, attendance, and payments — all in one beautifully designed dashboard.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
            {['📊 Analytics', '👨‍🎓 Students', '📅 Attendance', '💳 Payments', '🤖 AI Insights'].map((f, i) => (
              <span key={i} style={{ padding: '5px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom testimonial */}
        <div className="relative animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 20px' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, fontStyle: 'italic' }}>
              "EduSystem transformed how we manage our 300+ students. The AI analysis feature is incredible."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>AH</div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Ahmed Hassan</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>School Principal</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ background: 'var(--bg, #0D0F12)' }}>
        <div className="w-full max-w-[400px] animate-slide-up">
          {/* Mobile logo */}
          <div className="flex lg:hidden flex-col items-center mb-8 gap-3">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <h1 className="text-[22px] font-bold" style={{ color: 'var(--text, white)' }}>EduSystem</h1>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h2 className="text-[26px] font-bold leading-tight" style={{ color: 'var(--text, white)', letterSpacing: '-0.02em' }}>Welcome back 👋</h2>
            <p className="text-[14px] mt-1.5" style={{ color: 'var(--text-muted, rgba(255,255,255,0.4))' }}>Sign in to your account to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-5 animate-fade-in" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-[13px]" style={{ color: '#f87171' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted, rgba(255,255,255,0.5))' }}>Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="input"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color: 'var(--text-muted, rgba(255,255,255,0.5))' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input"
                  style={{ paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {showPw ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-[14px] mt-1 flex items-center justify-center gap-2"
              style={{ borderRadius: 12 }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Signing in...
                </>
              ) : 'Sign in →'}
            </button>
          </form>

          <p className="text-center text-[13px] mt-6" style={{ color: 'var(--text-muted, rgba(255,255,255,0.4))' }}>
            ليس لديك حساب؟{' '}
            <button
              onClick={() => navigate('/register')}
              className="font-semibold transition-colors"
              style={{ color: 'var(--accent-light, #a78bfa)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c4b5fd')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--accent-light, #a78bfa)')}
            >
              إنشاء حساب
            </button>
          </p>
        </div>
      </div>

      <style>{`@keyframes pulseDot { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.6)} 50%{box-shadow:0 0 0 5px rgba(124,58,237,0)} }`}</style>
    </div>
  )
}
