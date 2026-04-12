import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const features = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      title: 'إدارة الطلاب',
      desc: 'تتبع كامل للطلاب والدرجات',
      color: 'from-violet-500 to-indigo-600',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      title: 'الحضور اليومي',
      desc: 'تسجيل وتقارير فورية',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      ),
      title: 'المدفوعات',
      desc: 'إدارة الرسوم والمتأخرات',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
      ),
      title: 'تحليل ذكي',
      desc: 'تقارير بالذكاء الاصطناعي',
      color: 'from-amber-400 to-orange-500',
    },
  ]

  const stats = [
    { value: '100+', label: 'طالب' },
    { value: '50+',  label: 'معلم' },
    { value: '99%',  label: 'دقة' },
    { value: '24/7', label: 'متاح' },
  ]

  return (
    <div className="min-h-screen bg-[#0D0F14] flex flex-col items-center justify-center px-4 overflow-hidden relative">

      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className={`w-full max-w-2xl mx-auto text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20"
            style={{ animation: 'float 3s ease-in-out infinite' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>

          <p className="text-[11px] font-semibold text-violet-400 tracking-[3px] mb-3">EDUSYSTEM</p>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            إدارة مؤسستك التعليمية
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              بذكاء اصطناعي
            </span>
          </h1>

          <p className="text-[14px] text-white/40 max-w-md leading-7">
            منصة متكاملة لإدارة الطلاب والمعلمين والحضور والمدفوعات مع تحليل ذكي للأداء
          </p>
        </div>

        {/* Buttons */}
        <div
          className="flex items-center justify-center gap-3 mb-12"
          style={{ animation: 'fadeUp .6s .2s ease both' }}
        >
          <button
            onClick={() => navigate('/login', { state: { fromLanding: true } })}  {/* ← التعديل هنا */}
            className="px-7 py-3 bg-violet-600 hover:bg-violet-500 text-white text-[14px] font-semibold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/20"
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-7 py-3 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white/70 text-[14px] font-medium rounded-xl transition-all hover:scale-105 active:scale-95"
          >
            إنشاء حساب
          </button>
        </div>

        {/* Feature Cards */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10"
          style={{ animation: 'fadeUp .6s .35s ease both' }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all group"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-3 mx-auto group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <p className="text-[13px] font-semibold text-white/80 mb-1">{f.title}</p>
              <p className="text-[11px] text-white/30">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div
          className="flex items-center justify-center gap-8"
          style={{ animation: 'fadeUp .6s .5s ease both' }}
        >
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-[22px] font-bold text-violet-400">{s.value}</p>
              <p className="text-[11px] text-white/30 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}