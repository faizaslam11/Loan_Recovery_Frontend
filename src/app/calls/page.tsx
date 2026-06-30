'use client'
import { useEffect, useState, useRef } from 'react'
import { getCalls, getCustomers, getTranscript, Call, TranscriptEntry, Customer } from '@/lib/api'
import { formatDate, formatDuration, outcomeColor, outcomeLabel, sentimentColor, cn } from '@/lib/utils'
import {
  PhoneCall, MessageSquare, X, Mic, Bot, Clock,
  Globe, UserCheck, Play, Pause, Search, User, Phone,
  AlertCircle, ChevronRight, CreditCard
} from 'lucide-react'
import { useToast } from '@/lib/toast'

const STATUS_COLOR: Record<string, string> = {
  completed:   'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40',
  in_progress: 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/40',
  failed:      'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40',
  initiated:   'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40',
  no_answer:   'text-slate-500 bg-slate-100 dark:bg-slate-800',
}

const API = process.env.NEXT_PUBLIC_API_URL || 'https://loan-recovery-api.onrender.com'

export default function CallsPage() {
  const [calls, setCalls]             = useState<Call[]>([])
  const [customers, setCustomers]     = useState<Record<string, Customer>>({})
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<Call | null>(null)
  const [transcript, setTranscript]   = useState<TranscriptEntry[]>([])
  const [loadingTx, setLoadingTx]     = useState(false)
  const [escalating, setEscalating]   = useState(false)
  const [escalated, setEscalated]     = useState<string | null>(null)
  const [playing, setPlaying]         = useState(false)
  const [search, setSearch]           = useState('')
  const [hoveredCustomer, setHoveredCustomer] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { showError, showToast } = useToast()

  // Load calls + customers
  useEffect(() => {
    const load = async () => {
      const [callData, customerData] = await Promise.all([
        getCalls(0, 200),
        getCustomers(0, 200),
      ])
      setCalls(callData)
      // Build customer lookup map: id → customer
      const map: Record<string, Customer> = {}
      customerData.forEach(c => { map[c.id] = c })
      setCustomers(map)
      setLoading(false)
    }
    load()

    const interval = setInterval(() => {
      setCalls(prev => {
        const hasActive = prev.some(c => c.status === 'in_progress' || c.status === 'initiated')
        if (hasActive) {
          getCalls(0, 200).then(data => setCalls(data))
        }
        return prev
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const openTranscript = async (call: Call) => {
    setSelected(call)
    setLoadingTx(true)
    // Reset audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setPlaying(false)
    }
    try {
      const t = await getTranscript(call.id)
      setTranscript(t)
    } finally {
      setLoadingTx(false)
    }
  }

  const handleEndCall = async (callId: string) => {
    try {
      await fetch(`${API}/calls/${callId}/end`, { method: 'POST' })
      showToast('Call ended', 'success')
      getCalls(0, 200).then(data => setCalls(data))
    } catch (e) { showError(e) }
  }

  // Filter by search
  const filtered = calls.filter(c => {
    if (!search) return true
    const customer = customers[c.customer_id]
    const name = customer?.name?.toLowerCase() || ''
    const phone = customer?.phone?.toLowerCase() || ''
    const loan = customer?.loan_account_number?.toLowerCase() || ''
    const q = search.toLowerCase()
    return (
      name.includes(q) ||
      phone.includes(q) ||
      loan.includes(q) ||
      c.id.includes(q) ||
      (c.outcome || '').includes(q) ||
      (c.status || '').includes(q)
    )
  })

  const selectedCustomer = selected ? customers[selected.customer_id] : null

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="page-title">Call Logs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {calls.length} total calls · {calls.filter(c => c.status === 'in_progress' || c.status === 'initiated').length} active
          </p>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, loan..."
            className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-72 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-400"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Borrower', 'Status', 'Outcome', 'Language', 'Duration', 'Sentiment', 'Initiated', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <PhoneCall size={32} className="mx-auto mb-3 text-slate-200 dark:text-slate-700" />
                    <p className="text-slate-400 text-sm">
                      {search ? `No calls matching "${search}"` : 'No calls yet — trigger a call from the Customers page'}
                    </p>
                  </td>
                </tr>
              ) : filtered.map(c => {
                const customer = customers[c.customer_id]
                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">

                    {/* ── Borrower cell with hover card ── */}
                    <td className="px-4 py-3">
                      <div
                        className="relative"
                        onMouseEnter={() => setHoveredCustomer(c.id)}
                        onMouseLeave={() => setHoveredCustomer(null)}
                      >
                        {/* Customer name + phone */}
                        <div className="flex items-center gap-2.5 cursor-pointer">
                          <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950/50 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400 flex-shrink-0">
                            {customer?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[120px]">
                              {customer?.name || <span className="text-slate-400 font-normal">Unknown</span>}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {customer?.phone || c.customer_id.slice(0, 8) + '...'}
                            </p>
                          </div>
                        </div>

                        {/* Hover popup card */}
                        {hoveredCustomer === c.id && customer && (
                          <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 pointer-events-none">
                            {/* Card header */}
                            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/50 flex items-center justify-center text-sm font-bold text-brand-600 dark:text-brand-400">
                                {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white text-sm">{customer.name}</p>
                                <p className="text-xs text-slate-400 font-mono">{customer.phone}</p>
                              </div>
                              {customer.is_dnc && (
                                <span className="ml-auto text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md">DNC</span>
                              )}
                            </div>
                            {/* Loan details */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400 flex items-center gap-1"><CreditCard size={10} /> Loan Account</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{customer.loan_account_number}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Outstanding</span>
                                <span className="font-bold text-rose-600">₹{customer.outstanding_amount?.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">EMI Amount</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">₹{customer.emi_amount?.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Days Past Due</span>
                                <span className={cn('font-bold', customer.days_past_due > 30 ? 'text-rose-600' : customer.days_past_due > 7 ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300')}>
                                  {customer.days_past_due} days
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Risk Level</span>
                                <span className={cn('font-semibold capitalize', {
                                  'text-rose-600': customer.risk_level === 'critical',
                                  'text-amber-600': customer.risk_level === 'high',
                                  'text-brand-600': customer.risk_level === 'medium',
                                  'text-emerald-600': customer.risk_level === 'low',
                                })}>{customer.risk_level}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Total Calls</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{customer.total_calls_made}</span>
                              </div>
                              {customer.last_call_outcome && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-400">Last Outcome</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                                    {customer.last_call_outcome.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* View profile link hint */}
                            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1 text-xs text-brand-500">
                              <ChevronRight size={11} />
                              Click Transcript to see this call
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(c.status === 'in_progress' || c.status === 'initiated') && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                          </span>
                        )}
                        <span className={cn('badge', STATUS_COLOR[c.status] || 'text-slate-500 bg-slate-100')}>
                          {c.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>

                    {/* Outcome */}
                    <td className="px-4 py-3">
                      <span className={cn('badge', outcomeColor(c.outcome))}>{outcomeLabel(c.outcome)}</span>
                    </td>

                    {/* Language */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                        <Globe size={12} />
                        <span className="capitalize">{c.language_used}</span>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                        <Clock size={12} />
                        {formatDuration(c.duration_seconds)}
                      </div>
                    </td>

                    {/* Sentiment */}
                    <td className="px-4 py-3">
                      <span className={cn('text-sm font-medium capitalize', sentimentColor(c.sentiment_label))}>
                        {c.sentiment_label || '—'}
                      </span>
                    </td>

                    {/* Initiated */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{formatDate(c.initiated_at)}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openTranscript(c)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                        >
                          <MessageSquare size={13} /> Transcript
                        </button>
                        {(c.status === 'in_progress' || c.status === 'initiated') && (
                          <button
                            onClick={() => handleEndCall(c.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <PhoneCall size={13} /> End
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Transcript Modal ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-slide-up">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                {selectedCustomer && (
                  <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-950/50 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400">
                    {selectedCustomer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-display font-bold text-slate-900 dark:text-white">
                    {selectedCustomer?.name || 'Call Transcript'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedCustomer?.phone && <span className="mr-2">{selectedCustomer.phone}</span>}
                    <span className="font-mono">{selected.id.slice(0, 12)}...</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('badge', outcomeColor(selected.outcome))}>{outcomeLabel(selected.outcome)}</span>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
            </div>

            {/* Customer info strip */}
            {selectedCustomer && (
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-6 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <CreditCard size={11} className="text-slate-400" />
                  <span className="font-mono">{selectedCustomer.loan_account_number}</span>
                </div>
                <div>
                  <span className="text-slate-400">Outstanding: </span>
                  <span className="font-bold text-rose-600">₹{selectedCustomer.outstanding_amount?.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-400">EMI: </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">₹{selectedCustomer.emi_amount?.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-400">DPD: </span>
                  <span className={cn('font-bold', selectedCustomer.days_past_due > 30 ? 'text-rose-600' : 'text-amber-600')}>
                    {selectedCustomer.days_past_due} days
                  </span>
                </div>
                <span className={cn('badge capitalize', {
                  'text-rose-600 bg-rose-50 dark:bg-rose-950/40': selectedCustomer.risk_level === 'critical',
                  'text-amber-600 bg-amber-50 dark:bg-amber-950/40': selectedCustomer.risk_level === 'high',
                  'text-brand-600 bg-brand-50 dark:bg-brand-950/40': selectedCustomer.risk_level === 'medium',
                  'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40': selectedCustomer.risk_level === 'low',
                })}>
                  {selectedCustomer.risk_level} risk
                </span>
              </div>
            )}

            {/* AI Summary */}
            {(selected as any).summary && (
              <div className="mx-6 mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 flex-shrink-0">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">✨ AI Summary</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{(selected as any).summary}</p>
              </div>
            )}

            {/* Transcript */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {loadingTx ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : transcript.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
                  No transcript available for this call
                </div>
              ) : transcript.map((t, i) => (
                <div key={i} className={cn('flex gap-3', t.speaker === 'agent' ? 'flex-row' : 'flex-row-reverse')}>
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold',
                    t.speaker === 'agent' ? 'bg-brand-500' : 'bg-slate-400'
                  )}>
                    {t.speaker === 'agent' ? <Bot size={13} /> : <Mic size={13} />}
                  </div>
                  <div className={cn(
                    'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm',
                    t.speaker === 'agent'
                      ? 'bg-brand-50 dark:bg-brand-950/40 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-sm'
                  )}>
                    <p className="leading-relaxed">{t.text}</p>
                    {t.intent && t.intent !== 'unclear' && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 capitalize">
                        Intent: {t.intent.replace(/_/g, ' ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 space-y-3 flex-shrink-0">

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1"><Clock size={10} /> {formatDuration(selected.duration_seconds)}</span>
                <span className="flex items-center gap-1"><Globe size={10} /> {selected.language_used}</span>
                {selected.promise_amount && (
                  <span className="text-emerald-600 font-semibold">Promise: ₹{selected.promise_amount.toLocaleString('en-IN')}</span>
                )}
                {(selected.escalated_to_human || escalated === selected.id) && (
                  <span className="text-amber-500 font-semibold flex items-center gap-1">
                    <AlertCircle size={10} /> Escalated
                  </span>
                )}
              </div>

              {/* Recording */}
              {selected.recording_url ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <button
                    onClick={() => {
                      if (!audioRef.current) {
                        audioRef.current = new Audio(selected.recording_url!)
                        audioRef.current.onended = () => setPlaying(false)
                      }
                      if (playing) {
                        audioRef.current.pause()
                        setPlaying(false)
                      } else {
                        audioRef.current.play()
                        setPlaying(true)
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center text-white transition-colors shrink-0"
                  >
                    {playing ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Call Recording</p>
                    <p className="text-xs text-slate-400 truncate">{selected.recording_url}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-400">
                  <Play size={13} /> No recording available
                </div>
              )}

              {/* Escalate */}
              <button
                onClick={async () => {
                  if (escalated === selected.id || selected.escalated_to_human) return
                  setEscalating(true)
                  try {
                    await fetch(`${API}/calls/${selected.id}/escalate`, { method: 'POST' })
                    setEscalated(selected.id)
                    showToast('Escalated to human agent', 'success')
                  } catch {
                    showError(new Error('Escalation failed'))
                  } finally {
                    setEscalating(false)
                  }
                }}
                disabled={escalating || escalated === selected.id || selected.escalated_to_human}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all',
                  escalated === selected.id || selected.escalated_to_human
                    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 cursor-default'
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50'
                )}
              >
                {escalating
                  ? <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                  : <UserCheck size={15} />
                }
                {escalated === selected.id || selected.escalated_to_human
                  ? '✓ Escalated to human agent'
                  : 'Escalate to human agent'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
