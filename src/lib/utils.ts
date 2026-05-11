import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDuration(seconds: number) {
  if (!seconds) return '0s'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export function riskColor(level: string) {
  switch (level) {
    case 'critical': return 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40'
    case 'high':     return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40'
    case 'medium':   return 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/40'
    default:         return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40'
  }
}

export function sentimentColor(s?: string) {
  switch (s) {
    case 'angry':       return 'text-rose-600 dark:text-rose-400'
    case 'cooperative': return 'text-emerald-600 dark:text-emerald-400'
    case 'distressed':  return 'text-amber-600 dark:text-amber-400'
    default:            return 'text-slate-500 dark:text-slate-400'
  }
}

export function outcomeLabel(outcome?: string) {
  const map: Record<string, string> = {
    promise_to_pay: 'Promise to Pay',
    refused: 'Refused',
    callback_requested: 'Callback Requested',
    already_paid: 'Already Paid',
    escalated: 'Escalated',
    abusive: 'Abusive',
    incomplete: 'Incomplete',
    not_reachable: 'Not Reachable',
  }
  return outcome ? (map[outcome] || outcome) : '—'
}

export function outcomeColor(outcome?: string) {
  switch (outcome) {
    case 'promise_to_pay': return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40'
    case 'already_paid':   return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40'
    case 'refused':        return 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40'
    case 'abusive':        return 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40'
    case 'escalated':      return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40'
    default:               return 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800'
  }
}
