import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  ar: {
    dir: 'rtl' as const,
    badge: 'نظام إدارة تعليمي متكامل بالذكاء الاصطناعي',
    hero1: 'أدر مدرستك بذكاء',
    heroDesc: 'منصة شاملة تجمع إدارة الطلاب، المعلمين، الحضور، والمدفوعات — مع تحليل ذكي وتقارير آلية.',
    startFree: 'ابدأ مجاناً الآن', login: 'تسجيل الدخول', register: 'ابدأ مجاناً',
    watchDemo: 'مشاهدة العرض', scrollDown: 'تمرير للأسفل',
    trustText: 'ثقة', trustCount: '200+', trustSuffix: 'مؤسسة تعليمية',
    navFeatures: 'المميزات', navHow: 'كيف يعمل', navReviews: 'الآراء',
    featuresLabel: 'المميزات', featuresTitle: 'كل ما تحتاجه في مكان واحد',
    featuresDesc: 'منصة صُممت لتبسيط كل جانب من إدارة مؤسستك التعليمية',
    howLabel: 'كيف يعمل', howTitle: 'ثلاث خطوات للبدء',
    reviewsLabel: 'آراء المستخدمين', reviewsTitle: 'ماذا يقول مستخدمونا؟',
    ctaTitle: 'جاهز لتحويل مؤسستك؟',
    ctaDesc: 'انضم إلى أكثر من 200 مؤسسة وابدأ رحلة الإدارة الذكية اليوم — مجاناً.',
    createFree: 'إنشاء حساب مجاني',
    privacy: 'الخصوصية', terms: 'الشروط', support: 'الدعم',
    footer: '© 2025 EduSystem — جميع الحقوق محفوظة',
    typewords: ['بلا تعقيد', 'بكفاءة عالية', 'بأقل وقت', 'بتقارير آلية'],
    stats: [
      { value: 1200, suffix: '+', label: 'طالب مُسجَّل', sub: 'في مؤسسات متعددة' },
      { value: 98, suffix: '%', label: 'دقة تتبع الحضور', sub: 'مقارنة بالأنظمة التقليدية' },
      { value: 200, suffix: '+', label: 'مؤسسة تعليمية', sub: 'تستخدم النظام يومياً' },
      { value: 40, suffix: '%', label: 'توفير في الوقت', sub: 'للمهام الإدارية' },
    ],
    features: [
      { title: 'إدارة الطلاب', desc: 'سجلات أكاديمية كاملة، نتائج، وتتبع شامل لكل طالب.', accent: '124,58,237' },
      { title: 'إدارة المعلمين', desc: 'جداول الحصص، تقييمات الأداء، والتواصل مع الكادر.', accent: '5,150,105' },
      { title: 'الحضور اليومي', desc: 'تسجيل فوري وإشعارات غياب آلية لأولياء الأمور.', accent: '2,132,199' },
      { title: 'المدفوعات والرسوم', desc: 'متابعة حالة الرسوم، تنبيهات المتأخرات، وكشوفات مالية.', accent: '217,119,6' },
      { title: 'مساعد ذكاء اصطناعي', desc: 'تحليل أداء الطلاب وتوصيات مخصصة فورية.', accent: '219,39,119' },
      { title: 'تقارير وإحصائيات', desc: 'رسوم بيانية تفاعلية وتقارير آلية على Telegram.', accent: '124,58,237' },
    ],
    steps: [
      { num: '01', title: 'أنشئ حسابك', desc: 'سجّل مؤسستك في دقيقتين واستورد بياناتك تلقائياً.', icon: '🏫' },
      { num: '02', title: 'أضف الطلاب والمعلمين', desc: 'استوردهم من Excel أو أضفهم يدوياً.', icon: '👥' },
      { num: '03', title: 'ابدأ الإدارة الذكية', desc: 'حضور، مدفوعات، تقارير — في لوحة تحكم واحدة.', icon: '🚀' },
    ],
    reviews: [
      { name: 'أ. محمد الزهراني', role: 'مدير المدرسة', school: 'أكاديمية النخبة', text: 'وفّر علينا النظام ساعات من العمل اليدوي. تقارير الحضور والمدفوعات أصبحت تلقائية بالكامل.' },
      { name: 'أ. فاطمة العمري', role: 'مشرفة أكاديمية', school: 'مدرسة الإبداع', text: 'المساعد الذكي ساعدنا في تحديد الطلاب المحتاجين للدعم مبكراً.' },
      { name: 'أ. عمر الشمري', role: 'مسؤول مالي', school: 'معهد التميز', text: 'تتبع المدفوعات وإرسال الإشعارات أصبح آلياً — لا تأخير ولا أخطاء.' },
    ],
  },
  en: {
    dir: 'ltr' as const,
    badge: 'AI-Powered Educational Management System',
    hero1: 'Manage your school smartly',
    heroDesc: 'An all-in-one platform for students, teachers, attendance, and payments — with AI analytics and automated reports.',
    startFree: 'Start Free Now', login: 'Sign In', register: 'Get Started',
    watchDemo: 'Watch Demo', scrollDown: 'Scroll Down',
    trustText: 'Trusted by', trustCount: '200+', trustSuffix: 'institutions',
    navFeatures: 'Features', navHow: 'How It Works', navReviews: 'Reviews',
    featuresLabel: 'FEATURES', featuresTitle: 'Everything you need in one place',
    featuresDesc: 'A complete platform designed to simplify every aspect of managing your institution',
    howLabel: 'HOW IT WORKS', howTitle: 'Three steps to get started',
    reviewsLabel: 'TESTIMONIALS', reviewsTitle: 'What our users say',
    ctaTitle: 'Ready to transform your institution?',
    ctaDesc: 'Join over 200 educational institutions and start your smart management journey — for free.',
    createFree: 'Create Free Account',
    privacy: 'Privacy', terms: 'Terms', support: 'Support',
    footer: '© 2025 EduSystem — All rights reserved',
    typewords: ['without complexity', 'with high efficiency', 'saving time', 'with auto reports'],
    stats: [
      { value: 1200, suffix: '+', label: 'Enrolled Students', sub: 'across multiple institutions' },
      { value: 98, suffix: '%', label: 'Attendance Accuracy', sub: 'vs traditional systems' },
      { value: 200, suffix: '+', label: 'Institutions', sub: 'using the system daily' },
      { value: 40, suffix: '%', label: 'Time Saved', sub: 'on admin tasks' },
    ],
    features: [
      { title: 'Student Management', desc: 'Complete academic records and full tracking from enrollment to graduation.', accent: '124,58,237' },
      { title: 'Teacher Management', desc: 'Class schedules, performance evaluations, and direct staff communication.', accent: '5,150,105' },
      { title: 'Daily Attendance', desc: 'One-click recording and automatic absence notifications to parents.', accent: '2,132,199' },
      { title: 'Payments & Fees', desc: 'Track fee status, late payment alerts, and detailed financial statements.', accent: '217,119,6' },
      { title: 'AI Assistant', desc: 'Student performance analysis and personalized recommendations.', accent: '219,39,119' },
      { title: 'Reports & Analytics', desc: 'Interactive charts and automated Telegram/PDF reports.', accent: '124,58,237' },
    ],
    steps: [
      { num: '01', title: 'Create your account', desc: 'Register your institution in two minutes and import data automatically.', icon: '🏫' },
      { num: '02', title: 'Add students & teachers', desc: 'Import from Excel or add manually — the system adapts.', icon: '👥' },
      { num: '03', title: 'Start smart management', desc: 'Attendance, payments, reports — everything in one dashboard.', icon: '🚀' },
    ],
    reviews: [
      { name: 'Mohammed Al-Zahrani', role: 'School Principal', school: 'Elite Academy', text: 'The system saved us hours of manual work daily. Reports are now fully automated.' },
      { name: 'Fatima Al-Omari', role: 'Academic Supervisor', school: 'Innovation School', text: 'The AI assistant helped identify students needing support before problems escalated.' },
      { name: 'Omar Al-Shamri', role: 'Finance Manager', school: 'Excellence Institute', text: 'Payment tracking became fully automated — no delays, no errors.' },
    ],
  },
}

type Lang = 'ar' | 'en'

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el); return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const { ref, inView } = useInView(0.5)
  useEffect(() => {
    if (!inView) return
    let v = 0; const step = Math.ceil(target / 60)
    const t = setInterval(() => { v += step; if (v >= target) { setCount(target); clearInterval(t) } else setCount(v) }, 18)
    return () => clearInterval(t)
  }, [inView, target])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

function Typewriter({ words }: { words: string[] }) {
  const [wIdx, setWIdx] = useState(0); const [cIdx, setCIdx] = useState(0)
  const [del, setDel] = useState(false); const [txt, setTxt] = useState('')
  useEffect(() => {
    const cur = words[wIdx]
    const t = setTimeout(() => {
      if (!del) {
        setTxt(cur.slice(0, cIdx + 1))
        if (cIdx + 1 === cur.length) setTimeout(() => setDel(true), 1400)
        else setCIdx(c => c + 1)
      } else {
        setTxt(cur.slice(0, cIdx - 1))
        if (cIdx - 1 === 0) { setDel(false); setWIdx(w => (w + 1) % words.length); setCIdx(0) }
        else setCIdx(c => c - 1)
      }
    }, del ? 45 : 80)
    return () => clearTimeout(t)
  }, [cIdx, del, wIdx, words])
  return (
    <span style={{ color: '#a78bfa' }}>
      {txt}
      <span style={{ display: 'inline-block', width: 3, height: '0.9em', background: '#a78bfa', marginLeft: 2, verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />
    </span>
  )
}

// ─── Dashboard Preview ────────────────────────────────────────────────────────
function DashboardPreview() {
  const { ref, inView } = useInView(0.2)
  const bars = [65, 80, 55, 90, 72, 88, 76]
  const days = ['أح','إث','ث','أر','خ','ج','س']
  const rows = [
    { name: 'أحمد محمد', grade: 'A+', ok: true },
    { name: 'سارة العلي', grade: 'A', ok: true },
    { name: 'خالد النور', grade: 'B+', ok: false },
  ]
  return (
    <div ref={ref} style={{ position:'relative', opacity:inView?1:0, transform:inView?'perspective(1200px) rotateY(-6deg) rotateX(3deg) translateY(0)':'perspective(1200px) rotateY(-6deg) rotateX(3deg) translateY(60px)', transition:'all 1.1s cubic-bezier(.16,1,.3,1)' }}>
      <div style={{ position:'absolute', inset:-40, background:'radial-gradient(ellipse at center, rgba(124,58,237,0.2) 0%, transparent 65%)', pointerEvents:'none', filter:'blur(20px)' }} />
      <div style={{ background:'rgba(15,12,28,0.95)', border:'1px solid rgba(124,58,237,0.25)', borderRadius:20, overflow:'hidden', boxShadow:'0 40px 80px rgba(0,0,0,0.6)', maxWidth:560, width:'100%' }}>
        <div style={{ background:'rgba(10,8,20,0.8)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'10px 16px', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', gap:5 }}>{['#ff5f57','#ffbd2e','#28ca42'].map((c,i)=><div key={i} style={{ width:10, height:10, borderRadius:'50%', background:c }} />)}</div>
          <div style={{ flex:1, height:20, background:'rgba(255,255,255,0.04)', borderRadius:5, marginLeft:8, display:'flex', alignItems:'center', paddingLeft:8, gap:4 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#28ca42' }} />
            <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)' }}>edusystem.app/dashboard</span>
          </div>
        </div>
        <div style={{ display:'flex', height:340 }}>
          <div style={{ width:44, background:'rgba(8,6,18,0.9)', borderRight:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:6 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:'linear-gradient(135deg,#7c3aed,#4338ca)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>
            </div>
            {[0,1,2,3].map(i=><div key={i} style={{ width:30, height:30, borderRadius:7, background:i===0?'rgba(124,58,237,0.2)':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:12, height:12, borderRadius:2, background:i===0?'#a78bfa':'rgba(255,255,255,0.2)', opacity:0.7 }} /></div>)}
          </div>
          <div style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:8, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7 }}>
              {[{l:'الطلاب',v:'1,240',c:'#7c3aed'},{l:'الحضور',v:'94%',c:'#059669'},{l:'الرسوم',v:'87%',c:'#0284c7'}].map((s,i)=>(
                <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${s.c}22`, borderRadius:9, padding:'7px 9px' }}>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', marginBottom:3 }}>{s.l}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:9, padding:10, flex:1 }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', marginBottom:8 }}>نسبة الحضور الأسبوعية</div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:52 }}>
                {bars.map((h,i)=>(
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                    <div style={{ width:'100%', height:`${h*.55}px`, background:i===3?'linear-gradient(to top,#7c3aed,#a78bfa)':'rgba(124,58,237,0.22)', borderRadius:3 }} />
                    <span style={{ fontSize:7, color:'rgba(255,255,255,0.22)' }}>{days[i]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:9, overflow:'hidden' }}>
              <div style={{ padding:'5px 9px', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:9, color:'rgba(255,255,255,0.35)', display:'flex', justifyContent:'space-between' }}><span>الطالب</span><span>التقدير</span></div>
              {rows.map((r,i)=>(
                <div key={i} style={{ padding:'4px 9px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:i<2?'1px solid rgba(255,255,255,0.03)':'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:16, height:16, borderRadius:'50%', background:`hsl(${i*80+240},60%,45%)`, fontSize:7, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700 }}>{r.name[0]}</div>
                    <span style={{ fontSize:9, color:'rgba(255,255,255,0.6)' }}>{r.name}</span>
                  </div>
                  <span style={{ fontSize:9, fontWeight:700, color:r.ok?'#34d399':'#fbbf24' }}>{r.grade}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FEATURE_IMAGES = [
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&q=75',
  'https://images.unsplash.com/photo-1577896851905-27e69c5e2c2e?w=500&q=75',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=500&q=75',
  null, null, null,
]
const REVIEW_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=75',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&q=75',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=75',
]
const REVIEW_ACCENTS = ['#7c3aed','#059669','#0284c7']
const STAT_ICONS = ['👨‍🎓','✅','🏫','⚡']
const STAT_COLORS = ['#7c3aed','#059669','#0284c7','#d97706']
const TRUST_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=75',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&q=75',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&q=75',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=60&q=75',
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior:'smooth', block:'start' })
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<Lang>('ar')
  const [mounted, setMounted] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const t = T[lang]

  const heroRef   = useInView(0.1)
  const statsRef  = useInView(0.1)
  const featRef   = useInView(0.08)
  const howRef    = useInView(0.1)
  const revRef    = useInView(0.1)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60)
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll)
    return () => { clearTimeout(timer); window.removeEventListener('scroll', onScroll) }
  }, [])

  const btnBase: React.CSSProperties = { fontFamily:'inherit', cursor:'pointer', border:'none', transition:'all .2s' }
  const isAr = lang === 'ar'

  return (
    <div style={{ minHeight:'100vh', background:'#080612', color:'white', fontFamily:"'Cairo','Tajawal','Segoe UI',sans-serif", overflowX:'hidden', direction:t.dir }}>

      {/* ── NAVBAR ── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px', height:62, background:scrollY>40?'rgba(8,6,18,0.92)':'transparent', backdropFilter:scrollY>40?'blur(20px)':'none', borderBottom:scrollY>40?'1px solid rgba(124,58,237,0.12)':'none', transition:'all .4s ease' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#7c3aed,#4338ca)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(124,58,237,0.45)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <span style={{ fontWeight:800, fontSize:16, color:'#ede9ff' }}>EduSystem</span>
        </div>

        {/* Nav links — scroll to sections */}
        <div style={{ display:'flex', alignItems:'center', gap:28 }}>
          {([['features', t.navFeatures],['how', t.navHow],['reviews', t.navReviews]] as const).map(([id, label]) => (
            <button key={id} onClick={() => scrollTo(id)}
              style={{ ...btnBase, background:'none', fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:500, padding:0 }}
              onMouseEnter={e => (e.currentTarget.style.color='rgba(255,255,255,0.88)')}
              onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.5)')}
            >{label}</button>
          ))}
        </div>

        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {/* Language toggle */}
          <button onClick={() => setLang(l => l==='ar'?'en':'ar')}
            style={{ ...btnBase, padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:700, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.6)', letterSpacing:'0.06em' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(124,58,237,0.15)'; e.currentTarget.style.color='#c4b5fd'; e.currentTarget.style.borderColor='rgba(124,58,237,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)' }}
          >{isAr ? 'EN' : 'AR'}</button>

          <button onClick={() => navigate('/login')}
            style={{ ...btnBase, padding:'8px 20px', borderRadius:9, fontSize:13, fontWeight:600, background:'transparent', border:'1px solid rgba(124,58,237,0.4)', color:'#c4b5fd' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(124,58,237,0.12)'; e.currentTarget.style.borderColor='rgba(124,58,237,0.65)' }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(124,58,237,0.4)' }}
          >{t.login}</button>

          <button onClick={() => navigate('/register')}
            style={{ ...btnBase, padding:'8px 20px', borderRadius:9, fontSize:13, fontWeight:700, background:'linear-gradient(135deg,#7c3aed,#4338ca)', color:'white', boxShadow:'0 0 24px rgba(124,58,237,0.38)' }}
            onMouseEnter={e => { e.currentTarget.style.transform='scale(1.04)' }}
            onMouseLeave={e => { e.currentTarget.style.transform='scale(1)' }}
          >{t.register}</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', overflow:'hidden', paddingTop:62 }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:`radial-gradient(ellipse 80% 60% at 20% 40%, rgba(124,58,237,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(67,56,202,0.1) 0%, transparent 55%), linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px)`, backgroundSize:'auto,auto,64px 64px,64px 64px', pointerEvents:'none' }} />
        <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
          {Array.from({length:18},(_,i)=>i).map(i => {
            const x = (i * 17) % 100
            const y = (i * 29) % 100
            const s = 0.8 + (i % 4) * 0.45
            const d = 8 + (i % 6) * 2
            const dl = (i % 5) * 0.8
            const o = 0.04 + (i % 6) * 0.02
            return <div key={i} style={{ position:'absolute', left:`${x}%`, top:`${y}%`, width:s, height:s, borderRadius:'50%', background:`rgba(139,92,246,${o})`, animation:`particleDrift ${d}s ${dl}s ease-in-out infinite alternate` }} />
          })}
        </div>

        <div style={{ width:'100%', maxWidth:1240, margin:'0 auto', padding:'80px 40px', display:'grid', gridTemplateColumns:'1fr 1.1fr', alignItems:'center', gap:64 }}>
          <div ref={heroRef.ref} style={{ opacity:mounted&&heroRef.inView?1:0, transform:mounted&&heroRef.inView?'translateY(0)':'translateY(40px)', transition:'all 0.85s cubic-bezier(.16,1,.3,1)' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 14px', borderRadius:99, background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.28)', fontSize:12, color:'#a78bfa', fontWeight:600, marginBottom:26 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#7c3aed', boxShadow:'0 0 8px #7c3aed', animation:'pulse 2s infinite' }} />
              {t.badge}
            </div>
            <h1 style={{ fontSize:'clamp(2rem,4vw,3.2rem)', fontWeight:800, lineHeight:1.2, marginBottom:12, color:'#ede9ff', letterSpacing:'-0.025em' }}>{t.hero1}</h1>
            <h1 style={{ fontSize:'clamp(2rem,4vw,3.2rem)', fontWeight:800, lineHeight:1.2, marginBottom:24, letterSpacing:'-0.025em', minHeight:'1.2em' }}>
              <Typewriter words={t.typewords} />
            </h1>
            <p style={{ fontSize:15.5, color:'rgba(255,255,255,0.42)', lineHeight:1.85, maxWidth:460, marginBottom:38 }}>{t.heroDesc}</p>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:40 }}>
              <button onClick={() => navigate('/register')}
                style={{ ...btnBase, padding:'13px 32px', borderRadius:12, fontSize:15, fontWeight:700, background:'linear-gradient(135deg,#7c3aed,#4338ca)', color:'white', boxShadow:'0 8px 32px rgba(124,58,237,0.42)', display:'flex', alignItems:'center', gap:8 }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 14px 40px rgba(124,58,237,0.58)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(124,58,237,0.42)' }}
              >
                {t.startFree}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform:isAr?'rotate(180deg)':'none' }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button onClick={() => navigate('/login')}
                style={{ ...btnBase, padding:'13px 28px', borderRadius:12, fontSize:15, fontWeight:600, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.65)' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='rgba(255,255,255,0.9)' }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='rgba(255,255,255,0.65)' }}
              >{t.watchDemo}</button>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:14, paddingTop:28, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display:'flex' }}>
                {TRUST_AVATARS.map((src,i) => <img key={i} src={src} alt="" style={{ width:30, height:30, borderRadius:'50%', objectFit:'cover', border:'2px solid #080612', marginLeft:i>0?-8:0 }} />)}
              </div>
              <div>
                <div style={{ display:'flex', gap:2, marginBottom:3 }}>
                  {[...Array(5)].map((_,i) => <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill="#fbbf24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>)}
                </div>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', margin:0 }}>{t.trustText} <strong style={{ color:'rgba(255,255,255,0.6)' }}>{t.trustCount}</strong> {t.trustSuffix}</p>
              </div>
            </div>
          </div>
          <DashboardPreview />
        </div>

        <div style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:6, animation:'floatY 2.5s ease-in-out infinite', opacity:scrollY>100?0:0.5, transition:'opacity .4s' }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em' }}>{t.scrollDown}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding:'0 40px 80px', maxWidth:1240, margin:'0 auto' }}>
        <div ref={statsRef.ref} style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, opacity:statsRef.inView?1:0, transform:statsRef.inView?'translateY(0)':'translateY(30px)', transition:'all 0.75s cubic-bezier(.16,1,.3,1)' }}>
          {t.stats.map((s,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:18, padding:'22px 20px', transition:'all .3s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=`${STAT_COLORS[i]}33`; e.currentTarget.style.background=`${STAT_COLORS[i]}12` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.background='rgba(255,255,255,0.025)' }}>
              <div style={{ fontSize:26, marginBottom:10 }}>{STAT_ICONS[i]}</div>
              <div style={{ fontSize:30, fontWeight:800, color:STAT_COLORS[i], lineHeight:1, marginBottom:5 }}><Counter target={s.value} suffix={s.suffix} /></div>
              <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.65)', marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" ref={featRef.ref} style={{ padding:'80px 40px', maxWidth:1240, margin:'0 auto', opacity:featRef.inView?1:0, transform:featRef.inView?'translateY(0)':'translateY(40px)', transition:'all 0.85s cubic-bezier(.16,1,.3,1)' }}>
        <div style={{ textAlign:'center', marginBottom:60 }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', color:'#7c3aed', marginBottom:12 }}>{t.featuresLabel}</p>
          <h2 style={{ fontSize:'clamp(1.8rem,3.5vw,2.5rem)', fontWeight:800, color:'#ede9ff', margin:'0 0 14px', letterSpacing:'-0.02em' }}>{t.featuresTitle}</h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.38)', lineHeight:1.75, maxWidth:520, margin:'0 auto' }}>{t.featuresDesc}</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
          {t.features.map((f,i) => {
            const img = FEATURE_IMAGES[i]
            return (
              <div key={i}
                style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, overflow:'hidden', transition:'all .4s cubic-bezier(.16,1,.3,1)', cursor:'default' }}>
                {img && (
                  <div style={{ width:'100%', height:148, overflow:'hidden', position:'relative' }}>
                    <img src={img} alt={f.title} style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scale(1)', transition:'transform .6s ease', filter:'brightness(0.55) saturate(0.8)' }} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 40%, rgba(10,8,20,0.95) 100%)' }} />
                    <div style={{ position:'absolute', bottom:12, left:16, width:36, height:36, borderRadius:9, background:`rgba(${f.accent},0.2)`, border:`1px solid rgba(${f.accent},0.4)`, display:'flex', alignItems:'center', justifyContent:'center', color:`rgb(${f.accent})` }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    </div>
                  </div>
                )}
                <div style={{ padding:img?'14px 20px 22px':'24px 22px' }}>
                  {!img && <div style={{ width:44, height:44, borderRadius:12, background:`rgba(${f.accent},0.15)`, border:`1px solid rgba(${f.accent},0.3)`, display:'flex', alignItems:'center', justifyContent:'center', color:`rgb(${f.accent})`, marginBottom:14 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>}
                  <h3 style={{ fontSize:15, fontWeight:700, color:'#e8e4ff', margin:'0 0 7px' }}>{f.title}</h3>
                  <p style={{ fontSize:13, color:'rgba(255,255,255,0.38)', lineHeight:1.75, margin:0 }}>{f.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" ref={howRef.ref} style={{ padding:'80px 40px', maxWidth:1240, margin:'0 auto', opacity:howRef.inView?1:0, transform:howRef.inView?'translateY(0)':'translateY(40px)', transition:'all 0.85s cubic-bezier(.16,1,.3,1)' }}>
        <div style={{ textAlign:'center', marginBottom:60 }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', color:'#7c3aed', marginBottom:12 }}>{t.howLabel}</p>
          <h2 style={{ fontSize:'clamp(1.8rem,3.5vw,2.5rem)', fontWeight:800, color:'#ede9ff', margin:0, letterSpacing:'-0.02em' }}>{t.howTitle}</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24, position:'relative' }}>
          <div style={{ position:'absolute', top:36, right:'17%', left:'17%', height:1, background:'linear-gradient(to left, transparent, rgba(124,58,237,0.3) 30%, rgba(124,58,237,0.3) 70%, transparent)', pointerEvents:'none' }} />
          {t.steps.map((s,i) => (
            <div key={i} style={{ textAlign:'center', padding:'32px 24px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, transition:'all .35s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(124,58,237,0.07)'; e.currentTarget.style.borderColor='rgba(124,58,237,0.3)'; e.currentTarget.style.transform='translateY(-6px)' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.transform='translateY(0)' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(67,56,202,0.15))', border:'1px solid rgba(124,58,237,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 20px' }}>{s.icon}</div>
              <div style={{ fontSize:11, fontWeight:800, color:'#7c3aed', letterSpacing:'0.1em', marginBottom:10 }}>{s.num}</div>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#ede9ff', margin:'0 0 10px' }}>{s.title}</h3>
              <p style={{ fontSize:13.5, color:'rgba(255,255,255,0.38)', lineHeight:1.75, margin:0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section id="reviews" ref={revRef.ref} style={{ padding:'80px 40px', maxWidth:1240, margin:'0 auto', opacity:revRef.inView?1:0, transform:revRef.inView?'translateY(0)':'translateY(40px)', transition:'all 0.85s cubic-bezier(.16,1,.3,1)' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', color:'#7c3aed', marginBottom:12 }}>{t.reviewsLabel}</p>
          <h2 style={{ fontSize:'clamp(1.8rem,3.5vw,2.5rem)', fontWeight:800, color:'#ede9ff', margin:0, letterSpacing:'-0.02em' }}>{t.reviewsTitle}</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
          {t.reviews.map((r,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:24, transition:'all .3s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=`${REVIEW_ACCENTS[i]}40`; e.currentTarget.style.background='rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.background='rgba(255,255,255,0.025)' }}>
              <div style={{ display:'flex', gap:3, marginBottom:14 }}>
                {[...Array(5)].map((_,j) => <svg key={j} width="13" height="13" viewBox="0 0 24 24" fill="#fbbf24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>)}
              </div>
              <p style={{ fontSize:13.5, color:'rgba(255,255,255,0.55)', lineHeight:1.75, marginBottom:18, fontStyle:'italic' }}>"{r.text}"</p>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <img src={REVIEW_AVATARS[i]} alt={r.name} style={{ width:38, height:38, borderRadius:'50%', objectFit:'cover', border:`2px solid ${REVIEW_ACCENTS[i]}40` }} />
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'#e8e4ff', margin:0 }}>{r.name}</p>
                  <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', margin:0 }}>{r.role} · {r.school}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'60px 40px 100px', maxWidth:880, margin:'0 auto', textAlign:'center' }}>
        <div style={{ position:'relative', background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.22)', borderRadius:28, padding:'64px 56px', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse at center top, rgba(124,58,237,0.18) 0%, transparent 60%)' }} />
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:68, height:68, borderRadius:20, background:'linear-gradient(135deg,#7c3aed,#4338ca)', marginBottom:28, boxShadow:'0 16px 48px rgba(124,58,237,0.45)', animation:'floatIcon 3.5s ease-in-out infinite' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <h2 style={{ fontSize:'clamp(1.6rem,3vw,2.3rem)', fontWeight:800, color:'#ede9ff', margin:'0 0 14px', letterSpacing:'-0.02em' }}>{t.ctaTitle}</h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.4)', lineHeight:1.85, margin:'0 auto 36px', maxWidth:480 }}>{t.ctaDesc}</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => navigate('/register')}
              style={{ ...btnBase, padding:'14px 40px', borderRadius:12, fontSize:15, fontWeight:700, background:'linear-gradient(135deg,#7c3aed,#4338ca)', color:'white', boxShadow:'0 8px 32px rgba(124,58,237,0.48)' }}
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
            >{t.createFree}</button>
            <button onClick={() => navigate('/login')}
              style={{ ...btnBase, padding:'14px 32px', borderRadius:12, fontSize:15, fontWeight:600, background:'transparent', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.6)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.28)'; e.currentTarget.style.color='rgba(255,255,255,0.88)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; e.currentTarget.style.color='rgba(255,255,255,0.6)' }}
            >{t.login}</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'28px 40px' }}>
        <div style={{ maxWidth:1240, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#7c3aed,#4338ca)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>
            </div>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.35)', fontWeight:700 }}>EduSystem</span>
          </div>
          <div style={{ display:'flex', gap:28 }}>
            {[t.privacy, t.terms, t.support].map(item => (
              <a key={item} href="#" style={{ fontSize:12, color:'rgba(255,255,255,0.25)', textDecoration:'none', transition:'color .2s' }}
                onMouseEnter={e => (e.currentTarget.style.color='rgba(255,255,255,0.55)')}
                onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.25)')}
              >{item}</a>
            ))}
          </div>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.2)', margin:0 }}>{t.footer}</p>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0}body{overflow-x:hidden}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0.7)}50%{box-shadow:0 0 0 6px rgba(124,58,237,0)}}
        @keyframes floatIcon{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes floatY{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(6px)}}
        @keyframes particleDrift{from{transform:translateY(0) translateX(0)}to{transform:translateY(-35px) translateX(18px)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @media(max-width:900px){
          div[style*="grid-template-columns: 1fr 1.1fr"]{grid-template-columns:1fr!important}
          div[style*="repeat(3,1fr)"]{grid-template-columns:1fr!important}
          div[style*="repeat(4,1fr)"]{grid-template-columns:repeat(2,1fr)!important}
        }
      `}</style>
    </div>
  )
}
