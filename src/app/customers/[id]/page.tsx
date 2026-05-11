'use client'
import { useEffect, useState } from 'react'
import { getCustomer, getCalls, triggerCall, Customer, Call } from '@/lib/api'
import { formatCurrency, formatDate, riskColor, outcomeColor, outcomeLabel, cn } from '@/lib/utils'
import { Phone, ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [calling, setCalling] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    Promise.all([getCustomer(id), getCalls(0, 20, id)]).then(([c, calls]) => {
      setCustomer(c); setCalls(calls); setLoading(false)
    })
  }, [id])

  const handleCall = async () => {
    if (!customer) return
    setCalling(true)
    try {
      await triggerCall(customer.id)
      setToast('✅ Call initiated!')
    } catch (e: any) {
      setToast(`❌ ${e.message}`)
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
                    <Link href={`/calls?id=${c.id}`} className="text-xs text-brand-500 hover:underline">View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
