import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export default function StatCard({
  label, value, sub, icon: Icon, color = 'brand', trend
}: {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
  color?: 'brand' | 'emerald' | 'amber' | 'rose'
  trend?: { value: number; label: string }
}) {
  const colors = {
    brand:   'bg-brand-50 dark:bg-brand-950/40 text-brand-500',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500',
    amber:   'bg-amber-50 dark:bg-amber-950/40 text-amber-500',
    rose:    'bg-rose-50 dark:bg-rose-950/40 text-rose-500',
  }

  return (
    <div className="stat-card animate-slide-up">
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors[color])}>
          <Icon size={19} />
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full',
            trend.value >= 0
              ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40'
              : 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40'
          )}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  )
}
