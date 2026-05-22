'use client'
import { useEffect, useState } from 'react'
import { getCalls, getTranscript, Call, TranscriptEntry } from '@/lib/api'
import { formatDate, formatDuration, outcomeColor, outcomeLabel, sentimentColor, cn } from '@/lib/utils'
// import { PhoneCall, MessageSquare, X, Mic, Bot, Clock, Globe } from 'lucide-react'
import { PhoneCall, MessageSquare, X, Mic, Bot, Clock, Globe, UserCheck, Play, Pause } from 'lucide-react'
import { useToast } from '@/lib/toast'

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
  // AFTER the existing useState declarations
  const [escalating, setEscalating] = useState(false)
  const [escalated, setEscalated] = useState<string | null>(null) // stores call id
  const [playing, setPlaying] = useState(false)
  const audioRef = useState<HTMLAudioElement | null>(null)
  const { showError, showToast } = useToast()

  // useEffect(() => {
  //   getCalls(0, 100).then(data => { setCalls(data); setLoading(false) })
  // }, [])

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
  const handleEndCall = async (callId: string) => {
  try {
    const API = process.env.NEXT_PUBLIC_API_URL || 'https://loan-recovery-api.onrender.com'
    await fetch(`${API}/calls/${callId}/end`, { method: 'POST' })
    showToast('Call ended', 'success')
    getCalls(0, 100).then(data => setCalls(data))
  } catch (e) {
    showError(e)
  }
}
  // Replace the existing useEffect
  useEffect(() => {
    const load = () => getCalls(0, 100).then(data => { setCalls(data); setLoading(false) })
    load()

  // Auto-refresh every 5s if any call is in progress
    const interval = setInterval(() => {
      setCalls(prev => {
        const hasActive = prev.some(c => c.status === 'in_progress' || c.status === 'initiated')
        if (hasActive) load()
        return prev
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

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
                  {/* <td className="px-4 py-3">
                    <span className={cn('badge', STATUS_COLOR[c.status] || 'text-slate-500 bg-slate-100')}>{c.status}</span>
                  </td> */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {(c.status === 'in_progress' || c.status === 'initiated') && (
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                        </span>
                            )}
                         <span className={cn('badge', STATUS_COLOR[c.status] || 'text-slate-500 bg-slate-100')}>
                          {c.status}
                        </span>
                    </div>
                  </td>
                  {/* <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
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
                      <PhoneCall size={13} /> End Call
                        </button>
                        )}
                      </div>
                    </td> */}

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
                    <div className="flex items-center gap-2">
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
                        <PhoneCall size={13} /> End Call
                      </button>
                      )}
                      </div>
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

            {/* <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs text-slate-400">
              <span>Duration: {formatDuration(selected.duration_seconds)}</span>
              <span>Language: {selected.language_used}</span>
              {selected.promise_amount && <span>Promise: ₹{selected.promise_amount.toLocaleString('en-IN')}</span>}
              {selected.escalated_to_human && <span className="text-amber-500">⚠ Escalated</span>}
            </div> */}
            {/* Footer — meta + actions */}
<div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
  
  {/* Meta info */}
  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
    <span>Duration: {formatDuration(selected.duration_seconds)}</span>
    <span>Language: {selected.language_used}</span>
    {selected.promise_amount && (
      <span>Promise: ₹{selected.promise_amount.toLocaleString('en-IN')}</span>
    )}
    {(selected.escalated_to_human || escalated === selected.id) && (
      <span className="text-amber-500 font-medium">⚠ Escalated to human</span>
    )}
  </div>

  {/* Recording playback */}
  {selected.recording_url ? (
    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
      <button
        onClick={() => {
          const audio = audioRef[0] || new Audio(selected.recording_url!)
          if (!audioRef[0]) audioRef[0] = audio
          if (playing) {
            audio.pause()
            setPlaying(false)
          } else {
            audio.play()
            setPlaying(true)
            audio.onended = () => setPlaying(false)
          }
        }}
        className="w-8 h-8 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center text-white transition-colors shrink-0"
      >
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Call Recording</p>
        <p className="text-xs text-slate-400 truncate">{selected.recording_url}</p>
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-400">
      <Play size={13} />
      No recording available for this call
    </div>
  )}

  {/* Escalation button */}
  <button
    onClick={async () => {
      if (escalated === selected.id || selected.escalated_to_human) return
      setEscalating(true)
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'https://loan-recovery-api.onrender.com'
        await fetch(`${API}/calls/${selected.id}/escalate`, { method: 'POST' })
        setEscalated(selected.id)
      } catch {
          showError(new Error('Escalation failed — please try again'))
          setEscalated(selected.id) // still mark locally
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
