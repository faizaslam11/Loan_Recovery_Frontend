'use client'
import { Sun, Moon, Menu, Bell, RefreshCw, Phone, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { getCalls, Call } from '@/lib/api'
import Link from 'next/link'

const titles: Record<string, string> = {
  '/':          'Dashboard',
  '/customers': 'Customers',
  '/calls':     'Call Logs',
  '/analytics': 'Analytics',
  '/support':   'Support',
  '/settings':  'Settings',
}

const outcomeColor: Record<string, string> = {
  promise_to_pay:    'bg-emerald-500',
  already_paid:      'bg-blue-500',
  refused:           'bg-rose-500',
  callback_requested:'bg-amber-500',
  abusive:           'bg-red-700',
  escalated:         'bg-purple-500',
}

const outcomeLabel: Record<string, string> = {
  promise_to_pay:     'Promise to Pay',
  already_paid:       'Already Paid',
  refused:            'Refused',
  callback_requested: 'Callback',
  abusive:            'Abusive',
  escalated:          'Escalated',
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Topbar({
  dark, onToggleTheme, onToggleSidebar
}: {
  dark: boolean
  onToggleTheme: () => void
  onToggleSidebar: () => void
}) {
  const path = usePathname()
  const title = Object.entries(titles).find(([k]) => path === k || (k !== '/' && path.startsWith(k)))?.[1] || 'Dashboard'

  const [open, setOpen] = useState(false)
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(false)
  const [seen, setSeen] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch recent calls
  const fetchCalls = async () => {
    setLoading(true)
    try {
      const data = await getCalls(0, 10)
      setCalls(data)
    } catch {}
    finally { setLoading(false) }
  }

  // Auto-fetch on mount + every 30s
  useEffect(() => {
    fetchCalls()
    const interval = setInterval(fetchCalls, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = Math.max(0, calls.length - seen)

  const handleOpen = () => {
    setOpen(o => {
      if (!o) setSeen(calls.length) // mark all as read when opening
      return !o
    })
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-gray-950 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu size={18} className="text-slate-500 dark:text-slate-400" />
        </button>
        <h1 className="font-display font-bold text-lg text-slate-900 dark:text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Refresh */}
        <button
          onClick={() => window.location.reload()}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Refresh data"
        >
          <RefreshCw size={16} className="text-slate-400" />
        </button>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleOpen}
            className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell size={16} className="text-slate-400" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-rose-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-0.5">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">Recent Calls</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { fetchCalls() }}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw size={13} className="text-slate-400" />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X size={13} className="text-slate-400" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))
                ) : calls.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-400 text-sm">
                    <Phone size={24} className="mx-auto mb-2 opacity-30" />
                    No calls yet
                  </div>
                ) : calls.map(call => (
                  <Link
                    key={call.id}
                    href={`/calls`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${outcomeColor[call.outcome || ''] || 'bg-slate-300'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                          {call.outcome ? (outcomeLabel[call.outcome] || call.outcome.replace(/_/g, ' ')) : call.status}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {call.created_at ? timeAgo(call.created_at) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {call.language_used} · {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : 'No duration'}
                        {call.sentiment_label && ` · ${call.sentiment_label}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800">
                <Link
  href="/calls"
  onClick={(e) => {
    e.stopPropagation()
    setOpen(false)
  }}
  className="block w-full text-xs text-brand-500 hover:text-brand-600 font-medium"
>
  View all call logs →
</Link>
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
          <span className="hidden sm:inline">{dark ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </header>
  )
}