import { useState, useRef, useEffect } from 'react'
import api from '../api/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'مرحباً! أنا مساعدك الذكي. يمكنني الإجابة على أي سؤال عن الطلاب، الحضور، المدفوعات، والمعلمين. كيف يمكنني مساعدتك؟' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function fetchSystemData() {
    try {
      const [studentsRes, paymentsRes, summaryRes, attendanceRes] = await Promise.all([
        api.get('/students'),
        api.get('/payments'),
        api.get('/payments/summary'),
        api.get('/attendance'),
      ])

      const students = studentsRes.data.students || []
      const payments = paymentsRes.data.payments || []
      const summary = summaryRes.data.summary || {}
      const attendance = attendanceRes.data.records || []

      return { students, payments, summary, attendance }
    } catch {
      return null
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const data = await fetchSystemData()

      const systemPrompt = `أنت مساعد ذكي لنظام إدارة تعليمي. لديك البيانات التالية الحقيقية من النظام:

${data ? `
## الطلاب (${data.students.length} طالب):
${JSON.stringify(data.students.map((s: any) => ({
  id: s.id,
  name: s.name,
  course: s.course,
  grade: s.grade,
  status: s.status,
})), null, 2)}

## ملخص المدفوعات:
- إجمالي الرسوم: ${data.summary.total} ريال
- المحصّل: ${data.summary.paid} ريال
- المعلق: ${data.summary.pending} ريال
- المتأخر: ${data.summary.overdue} ريال

## سجلات الدفع (${data.payments.length} سجل):
${JSON.stringify(data.payments.map((p: any) => ({
  student: p.student?.name,
  amount: p.amount,
  status: p.status,
  date: p.date,
})), null, 2)}

## سجلات الحضور اليوم (${data.attendance.length} سجل):
${JSON.stringify(data.attendance.map((a: any) => ({
  student: a.student?.name,
  status: a.status,
})), null, 2)}
` : 'تعذر جلب البيانات حالياً.'}

## تعليمات:
- أجب بالعربية دائماً
- كن محدداً واذكر الأرقام والأسماء الحقيقية من البيانات
- إذا سألوا عن طالب معين ابحث في القائمة وأعطِ معلومات دقيقة
- إذا طلبوا ملخصاً أعطِ إحصائيات شاملة
- كن مختصراً وواضحاً`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg.content }
          ],
        }),
      })

      const result = await response.json()
      const reply = result.content?.[0]?.text || 'عذراً، حدث خطأ.'

      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'عذراً، حدث خطأ في الاتصال. حاول مرة أخرى.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-50 w-13 h-13 w-[52px] h-[52px] rounded-2xl bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] bg-[#111318] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: '480px' }}>

          {/* Header */}
          <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 10 10M12 6v6l4 2"/>
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white">المساعد الذكي</p>
              <p className="text-[10px] text-white/35">يعرف كل شيء عن النظام</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-emerald-400">متصل</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-6 ${
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white rounded-br-sm'
                    : 'bg-white/[0.05] text-white/80 rounded-bl-sm'
                }`} dir="rtl">
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.05] px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {['كم عدد الطلاب؟', 'ملخص المدفوعات', 'من غاب اليوم؟', 'أداء الفصل'].map(s => (
                <button key={s} onClick={() => { setInput(s); }}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-white/[0.08] text-white/40 hover:text-violet-400 hover:border-violet-500/30 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/[0.06] flex items-center gap-2 shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="اسأل عن أي شيء..."
              dir="rtl"
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-white/80 placeholder:text-white/25 outline-none focus:border-violet-500/40 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}