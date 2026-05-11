'use client'
import { useEffect, useState } from 'react'
import { getCalls, getTranscript, Call, TranscriptEntry } from '@/lib/api'
import { formatDate, formatDuration, outcomeColor, outcomeLabel, sentimentColor, cn } from '@/lib/utils'
import { PhoneCall, MessageSquare, X, Mic, Bot, Clock, Globe } from 'lucide-react'

const STATUS_COLOR: Record<string, string> = {
  completed:   'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40',
  in_progress: 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/40',
  failed:      'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40',
  initiated:   'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40',
  no_answer:   'text-slate-500 bg-slate-100 dark:bg-slate-800',
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Call | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [loadingTranscript, setLoadingTranscript] = useState(false)

  useEffect(() => {
    getCalls(0, 100).then(data => { setCalls(data); setLoading(false) })
  }, [])

  const openTranscript = async (call: Call) => {
    setSelected(call)
    setLoadingTranscript(true)
    try {
      const t = await getTranscript(call.id)
      setTranscript(t)
    } finally {
      setLoadingTranscript(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h2 className="page-title">Call Logs</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{calls.length} total calls recorded</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Call ID', 'Status', 'Outcome', 'Language', 'Duration', 'Sentiment', 'Initiated', 'Actions'].map(h => (
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
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <PhoneCall size={32} className="mx-auto mb-3 text-slate-200 dark:text-slate-700" />
                    <p className="text-slate-400 text-sm">No calls yet — trigger a call from the Customers page</p>
                  </td>
                </tr>
              ) : calls.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{c.id.slice(0, 8)}...</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('badge', STATUS_COLOR[c.status] || 'text-slate-500 bg-slate-100')}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('badge', outcomeColor(c.outcome))}>{outcomeLabel(c.outcome)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                      <Globe size={12} />
                      {c.language_used}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                      <Clock size={12} />
                      {formatDuration(c.duration_seconds)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-sm font-medium', sentimentColor(c.sentiment_label))}>
                      {c.sentiment_label || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-500">{formatDate(c.initiated_at)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openTranscript(c)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                    >
                      <MessageSquare size={13} /> Transcript
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transcript Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white">Call Transcript</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{selected.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('badge', outcomeColor(selected.outcome))}>{outcomeLabel(selected.outcome)}</span>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
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
                <div className="text-center py-8 text-slate-400 text-sm">No transcript available for this call</div>
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
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Intent: {t.intent.replace(/_/g, ' ')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs text-slate-400">
              <span>Duration: {formatDuration(selected.duration_seconds)}</span>
              <span>Language: {selected.language_used}</span>
              {selected.promise_amount && <span>Promise: ₹{selected.promise_amount.toLocaleString('en-IN')}</span>}
              {selected.escalated_to_human && <span className="text-amber-500">⚠ Escalated</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
