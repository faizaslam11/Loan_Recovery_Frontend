'use client'
import { useEffect, useState } from 'react'
import { getCustomer, getCalls, triggerCall, Customer, Call } from '@/lib/api'
import { formatCurrency, formatDate, riskColor, outcomeColor, outcomeLabel, cn } from '@/lib/utils'
import { Phone, ArrowLeft, AlertTriangle, CheckCircle2, X, Bot, Mic } from 'lucide-react'
import { getTranscript, TranscriptEntry } from '@/lib/api'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useToast } from '@/lib/toast'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [calling, setCalling] = useState(false)
  const [toast, setToast] = useState('')
  const { showError } = useToast()
  // Add after existing useState declarations
const [selectedCall, setSelectedCall] = useState<Call | null>(null)
const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
const [loadingTranscript, setLoadingTranscript] = useState(false)

const openTranscript = async (call: Call) => {
  setSelectedCall(call)
  setLoadingTranscript(true)
  try {
    const t = await getTranscript(call.id)
    setTranscript(t)
  } finally {
    setLoadingTranscript(false)
  }
}

  useEffect(() => {
    Promise.all([getCustomer(id), getCalls(0, 20, id)]).then(([c, calls]) => {
      setCustomer(c); setCalls(calls); setLoading(false)
    })
  }, [id])

  // const handleCall = async () => {
  //   if (!customer) return
  //   setCalling(true)
  //   try {
  //     await triggerCall(customer.id)
  //     setToast('✅ Call initiated!')
  //   } catch (e: any) {
  //     setToast(`❌ ${e.message}`)
  //   } finally {
  //     setCalling(false)
  //     setTimeout(() => setToast(''), 3000)
  //   }
  // }
  const handleCall = async () => {
  if (!customer) return
  setCalling(true)
  try {
    await triggerCall(customer.id)
    setToast('✅ Call initiated!')
  } catch (e) {
    showError(e)  // ← shows proper error toast globally
    setToast('')  // clear local toast
  } finally {
    setCalling(false)
    setTimeout(() => setToast(''), 3000)
  }
}


  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!customer) return <div className="text-center py-16 text-slate-400">Customer not found</div>

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {toast && <div className="fixed top-5 right-5 z-50 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm shadow-lg">{toast}</div>}

      <div className="flex items-center gap-3">
        <Link href="/customers" className="btn-secondary py-1.5 px-3"><ArrowLeft size={15} /> Back</Link>
        <h2 className="page-title">{customer.name}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile card */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-lg font-bold text-brand-600 dark:text-brand-400">
              {customer.name.split(' ').map(n => n[0]).join('').slice(0,2)}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{customer.name}</p>
              <p className="text-xs text-slate-400 font-mono">{customer.phone}</p>
            </div>
          </div>
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {[
              ['Loan Account', customer.loan_account_number],
              ['Outstanding', formatCurrency(customer.outstanding_amount)],
              ['EMI Amount', formatCurrency(customer.emi_amount)],
              ['Days Past Due', `${customer.days_past_due} days`],
              ['Language', customer.language_preference],
              ['Total Calls', customer.total_calls_made],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-slate-400">{k}</span>
                <span className="font-medium text-slate-800 dark:text-white">{v}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-1">
              <span className="text-slate-400">Risk Level</span>
              <span className={cn('badge', riskColor(customer.risk_level))}>{customer.risk_level}</span>
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {customer.is_dnc && <span className="badge text-rose-600 bg-rose-50 dark:bg-rose-950/40"><AlertTriangle size={11} /> DNC</span>}
            {customer.consent_given && <span className="badge text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"><CheckCircle2 size={11} /> Consent</span>}
          </div>
          <button onClick={handleCall} disabled={calling || customer.is_dnc} className="btn-primary w-full justify-center">
            {calling ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Phone size={15} />}
            {calling ? 'Calling...' : 'Trigger AI Call'}
          </button>
        </div>

        {/* Call history */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-4">Call History ({calls.length})</h3>
          {calls.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No calls made yet</div>
          ) : (
            <div className="space-y-2.5">
              {calls.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-2 h-2 rounded-full', c.outcome === 'promise_to_pay' ? 'bg-emerald-500' : c.outcome === 'refused' ? 'bg-rose-500' : 'bg-slate-300')} />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{outcomeLabel(c.outcome)}</p>
                      <p className="text-xs text-slate-400">{formatDate(c.initiated_at)} · {c.duration_seconds}s · {c.language_used}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('badge text-xs', outcomeColor(c.outcome))}>{c.sentiment_label || '—'}</span>
                   <button 
                      onClick={() => openTranscript(c)}
                      className="text-xs text-brand-500 hover:underline"
                    >
                      View
                    </button>
                    {/* <Link href={`/calls?id=${c.id}`} className="text-xs text-brand-500 hover:underline">View</Link> */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {selectedCall && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white">Call Transcript</h3>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(selectedCall.initiated_at)} · {selectedCall.language_used}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('badge', outcomeColor(selectedCall.outcome))}>{outcomeLabel(selectedCall.outcome)}</span>
                <button onClick={() => setSelectedCall(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {loadingTranscript ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : transcript.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No transcript available</div>
              ) : transcript.map((t, i) => (
                <div key={i} className={cn('flex gap-3', t.speaker === 'agent' ? 'flex-row' : 'flex-row-reverse')}>
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white',
                    t.speaker === 'agent' ? 'bg-brand-500' : 'bg-slate-400'
                  )}>
                    {t.speaker === 'agent' ? <Bot size={13} /> : <Mic size={13} />}
                  </div>
                  <div className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                    t.speaker === 'agent'
                      ? 'bg-brand-50 dark:bg-brand-950/40 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-sm'
                  )}>
                    <p>{t.text}</p>
                    {t.intent && t.intent !== 'unclear' && (
                      <p className="text-xs text-slate-400 mt-1">Intent: {t.intent.replace(/_/g, ' ')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <span>Duration: {selectedCall.duration_seconds}s</span>
              <span>Language: {selectedCall.language_used}</span>
              {selectedCall.promise_amount && <span>Promise: ₹{selectedCall.promise_amount.toLocaleString('en-IN')}</span>}
              {selectedCall.escalated_to_human && <span className="text-amber-500 font-medium">⚠ Escalated</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
