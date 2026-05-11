'use client'
import { useState } from 'react'
import {
  HeadphonesIcon, Mail, Phone, MessageSquare,
  CheckCircle2, AlertCircle, Clock, Zap, Shield, ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ISSUE_TYPES = [
  'Call not triggering',
  'AI response incorrect',
  'Customer data issue',
  'Payment link not sent',
  'Dashboard not loading',
  'Compliance concern',
  'Billing / Account',
  'Feature request',
  'Other',
]

const FAQS = [
  {
    q: 'Why is the AI calling outside permitted hours?',
    a: 'The system enforces RBI-mandated hours (8 AM – 7 PM IST) automatically. If you believe a call went outside these hours, please raise a support ticket with the call ID so we can investigate.'
  },
  {
    q: 'A customer is on DNC but still received a call?',
    a: 'Mark the customer as DNC in the Customers page and our system will block all future calls. If the call already happened, please submit a ticket immediately with the call ID.'
  },
  {
    q: 'How do I bulk import customers from Excel?',
    a: 'Go to Customers → Bulk Import. Download our CSV template, fill it in, and upload. Up to 500 customers per import. The system assigns risk scores automatically.'
  },
  {
    q: 'The call transcript is empty — why?',
    a: 'Transcripts populate after the call ends. If empty after 10 minutes, it likely means the call was too short or STT service had an issue. Check the recording URL for the raw audio.'
  },
  {
    q: 'How do I escalate to a human agent?',
    a: 'The AI escalates automatically when it detects anger, abuse, or sensitive situations. You can also manually trigger escalation from the call detail view. Configure your human agent number in Settings.'
  },
]

export default function SupportPage() {
  const [form, setForm] = useState({
    name: '', email: '', bank: '', phone: '', issueType: '', subject: '', description: '', priority: 'medium'
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.issueType || !form.description) {
      setError('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    setError('')

    // Simulate form submission (replace with real email/API call)
    await new Promise(r => setTimeout(r, 1500))

    // In production, send to your backend:
    // await fetch('/api/support', { method: 'POST', body: JSON.stringify(form) })

    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center animate-slide-up">
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <h2 className="page-title mb-2">Ticket Submitted!</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          We've received your request and will respond within 4 business hours.
          Check your email <strong>{form.email}</strong> for a confirmation.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name:'', email:'', bank:'', phone:'', issueType:'', subject:'', description:'', priority:'medium' }) }}
          className="btn-primary"
        >
          Submit Another Ticket
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h2 className="page-title">Support Center</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">We're here to help — average response time 4 hours</p>
      </div>

      {/* Support channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Mail,           label: 'Email Support',    val: 'support@loanrecovery.ai',   color: 'brand',   note: 'Response in 4 hrs' },
          { icon: Phone,          label: 'Phone Support',    val: '+91 98765 43210',            color: 'emerald', note: 'Mon–Sat, 9am–6pm' },
          { icon: MessageSquare,  label: 'WhatsApp',         val: 'Chat with us',               color: 'amber',   note: 'Instant replies' },
        ].map(({ icon: Icon, label, val, color, note }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              color === 'brand'   ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-500'   :
              color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500' :
                                    'bg-amber-50 dark:bg-amber-950/40 text-amber-500'
            )}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{val}</p>
              <p className="text-xs text-slate-400">{note}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Contact Form */}
        <div className="lg:col-span-3 card p-6 space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <HeadphonesIcon size={18} className="text-brand-500" />
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Submit a Ticket</h3>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-3 py-2.5 rounded-xl">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Your Name *</label>
              <input className="input" placeholder="Amit Singh" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Email *</label>
              <input className="input" type="email" placeholder="amit@abcbank.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Bank / NBFC Name</label>
              <input className="input" placeholder="ABC Finance Ltd" value={form.bank} onChange={e => set('bank', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Phone</label>
              <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Issue Type *</label>
              <select className="input" value={form.issueType} onChange={e => set('issueType', e.target.value)}>
                <option value="">Select issue type</option>
                {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Priority</label>
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="low">🟢 Low — General question</option>
                <option value="medium">🟡 Medium — Issue affecting work</option>
                <option value="high">🔴 High — Blocking operations</option>
                <option value="critical">🚨 Critical — Compliance / Legal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Subject</label>
            <input className="input" placeholder="Brief description of the issue" value={form.subject} onChange={e => set('subject', e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Description * <span className="font-normal text-slate-400">(include call IDs if relevant)</span></label>
            <textarea
              className="input min-h-[120px] resize-none"
              placeholder="Describe the issue in detail. Include any error messages, call IDs, customer names, or timestamps that might help us investigate..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary w-full justify-center py-3"
          >
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
            ) : (
              <><Mail size={16} /> Submit Support Ticket</>
            )}
          </button>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">

          {/* SLA info */}
          <div className="card p-5 space-y-3">
            <h4 className="font-semibold text-slate-800 dark:text-white text-sm">Response Times</h4>
            {[
              { priority: 'Critical', time: '1 hour', icon: Zap,    color: 'text-rose-500' },
              { priority: 'High',     time: '4 hours', icon: AlertCircle, color: 'text-amber-500' },
              { priority: 'Medium',   time: '8 hours', icon: Clock,  color: 'text-brand-500' },
              { priority: 'Low',      time: '24 hours', icon: Shield, color: 'text-emerald-500' },
            ].map(({ priority, time, icon: Icon, color }) => (
              <div key={priority} className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
                <div className="flex items-center gap-2">
                  <Icon size={14} className={color} />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{priority}</span>
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{time}</span>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="card p-5">
            <h4 className="font-semibold text-slate-800 dark:text-white text-sm mb-3">Common Questions</h4>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div key={i} className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 pr-3">{faq.q}</span>
                    <ChevronDown size={14} className={cn('flex-shrink-0 text-slate-400 transition-transform', openFaq === i ? 'rotate-180' : '')} />
                  </button>
                  {openFaq === i && (
                    <div className="px-3 pb-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-800 pt-2">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
