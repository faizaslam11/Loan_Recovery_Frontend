'use client'
import { useEffect, useState } from 'react'
import {
  getDashboard, getCallsByOutcome, getCallsByDay, getSentimentDist,
  DashboardData, OutcomeData, DayData, SentimentData
} from '@/lib/api'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  Users, PhoneCall, TrendingUp, CheckCircle2,
  AlertTriangle, Clock, PhoneOff, Smile, ArrowUpRight,
  ArrowDownRight, Activity, Target, Zap
} from 'lucide-react'
import { formatDuration, cn } from '@/lib/utils'

const OUTCOME_COLORS: Record<string, string> = {
  promise_to_pay:     '#10b981',
  already_paid:       '#059669',
  refused:            '#f43f5e',
  escalated:          '#f59e0b',
  callback_requested: '#6366f1',
  abusive:            '#dc2626',
  incomplete:         '#94a3b8',
}

const OUTCOME_LABELS: Record<string, string> = {
  promise_to_pay:     'Promise to Pay',
  already_paid:       'Already Paid',
  refused:            'Refused',
  escalated:          'Escalated',
  callback_requested: 'Callback',
  abusive:            'Abusive',
  incomplete:         'Incomplete',
}

const SENTIMENT_COLORS: Record<string, string> = {
  cooperative: '#10b981',
  neutral:     '#6366f1',
  distressed:  '#f59e0b',
  angry:       '#f43f5e',
}

const API = process.env.NEXT_PUBLIC_API_URL || 'https://loan-recovery-api.onrender.com'

interface TopStats {
  total_calls: number
  completed_calls: number
  promise_to_pay: number
  refused: number
  escalated: number
  already_paid: number
  callback_requested: number
  avg_duration_seconds: number
  this_week_calls: number
  last_week_calls: number
  week_change_percent: number
  recovery_rate: number
  connect_rate: number
  escalation_rate: number
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, color = 'brand', trend, badge
}: {
  label: string
  value: string | number
  sub?: string
  icon?: any
  color?: string
  trend?: number
  badge?: string
}) {
  const iconColors: Record<string, string> = {
    brand:   'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/40',
    emerald: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40',
    rose:    'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40',
    amber:   'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40',
    violet:  'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/40',
    slate:   'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        {Icon && (
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconColors[color])}>
            <Icon size={15} />
          </div>
        )}
      </div>
      <p className="text-2xl font-display font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
      <div className="flex items-center justify-between mt-1.5">
        {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
        {trend !== undefined && (
          <div className={cn('flex items-center gap-0.5 text-xs font-semibold ml-auto', trend >= 0 ? 'text-emerald-600' : 'text-rose-500')}>
            {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
        {badge && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-1.5 py-0.5 rounded-md ml-auto">
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2 shadow-lg text-xs">
      {label && <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-800 dark:text-white">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData]         = useState<DashboardData | null>(null)
  const [stats, setStats]       = useState<TopStats | null>(null)
  const [outcomes, setOutcomes] = useState<OutcomeData[]>([])
  const [byDay, setByDay]       = useState<DayData[]>([])
  const [sentiment, setSentiment] = useState<SentimentData[]>([])
  const [loading, setLoading]   = useState(true)
  const [now, setNow]           = useState('')

  useEffect(() => {
    setNow(new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }))
    Promise.all([
      getDashboard(),
      getCallsByOutcome(),
      getCallsByDay(7),
      getSentimentDist(),
      fetch(`${API}/analytics/top-stats`).then(r => r.json()).catch(() => null),
    ]).then(([d, o, day, s, ts]) => {
      setData(d)
      setOutcomes(o || [])
      setByDay(day || [])
      setSentiment(s || [])
      setStats(ts)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading dashboard...</p>
      </div>
    </div>
  )

  if (!data) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
      Failed to load. Please refresh.
    </div>
  )

  const d = data
  const totalOutcomes = outcomes.reduce((s, o) => s + o.count, 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="page-title">Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Recovery performance at a glance
            {now && <span className="ml-2 text-slate-400">· {now}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">AI Agent Active</span>
          </div>
        </div>
      </div>

      {/* ── Row 1: Primary KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Customers"
          value={d.customers.total}
          sub={`${d.customers.high_risk} high risk · ${d.customers.critical} critical`}
          icon={Users}
          color="brand"
        />
        <StatCard
          label="Calls Today"
          value={d.calls.today}
          sub={`${d.calls.this_week} this week · ${d.calls.total} total`}
          icon={PhoneCall}
          color="brand"
          trend={stats?.week_change_percent}
        />
        <StatCard
          label="Recovery Rate"
          value={`${stats?.recovery_rate ?? d.outcomes.recovery_rate_percent}%`}
          sub={`${d.outcomes.promise_to_pay} payment promises captured`}
          icon={Target}
          color="emerald"
          badge={d.outcomes.recovery_rate_percent >= 30 ? 'Good' : undefined}
        />
        <StatCard
          label="Avg Call Duration"
          value={formatDuration(d.calls.avg_duration_seconds)}
          sub={`${d.calls.completed} calls completed`}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* ── Row 2: Outcome Counts ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Promise to Pay"
          value={d.outcomes.promise_to_pay}
          sub="Committed to a payment date"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          label="Already Paid"
          value={d.outcomes.already_paid}
          sub="Self-resolved before the call"
          icon={Smile}
          color="emerald"
        />
        <StatCard
          label="Refused"
          value={d.outcomes.refused}
          sub="Declined to commit"
          icon={PhoneOff}
          color="rose"
        />
        <StatCard
          label="Escalated"
          value={d.outcomes.escalated}
          sub={`${stats?.escalation_rate ?? 0}% escalation rate`}
          icon={AlertTriangle}
          color={d.outcomes.escalated > 5 ? 'amber' : 'slate'}
        />
      </div>

      {/* ── Row 3: Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Call volume area chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4">
            <p className="font-semibold text-slate-800 dark:text-white text-sm">Call Volume — Last 7 Days</p>
            <p className="text-xs text-slate-400 mt-0.5">Daily number of outbound calls made by the AI agent</p>
          </div>
          {byDay.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              <div className="text-center">
                <Activity size={28} className="mx-auto mb-2 opacity-30" />
                No call data for the last 7 days
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={byDay} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTip />} />
                <Area
                  type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5}
                  fill="url(#cGrad)" name="Calls"
                  dot={{ fill: '#6366f1', r: 3, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Outcomes donut */}
        <div className="card p-5">
          <div className="mb-4">
            <p className="font-semibold text-slate-800 dark:text-white text-sm">Call Outcomes</p>
            <p className="text-xs text-slate-400 mt-0.5">How calls ended across all time</p>
          </div>
          {outcomes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm">
              <PhoneCall size={28} className="mb-2 opacity-30" />
              No call outcomes yet
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={outcomes} dataKey="count" nameKey="outcome"
                    cx="50%" cy="50%" outerRadius={72} innerRadius={44}
                    paddingAngle={2}
                  >
                    {outcomes.map((o, i) => (
                      <Cell key={i} fill={OUTCOME_COLORS[o.outcome] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<ChartTip />}
                    formatter={(v: any, n: any) => [v, OUTCOME_LABELS[n] || n]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {outcomes.slice(0, 5).map(o => {
                  const pct = totalOutcomes > 0 ? Math.round(o.count / totalOutcomes * 100) : 0
                  return (
                    <div key={o.outcome} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: OUTCOME_COLORS[o.outcome] || '#94a3b8' }} />
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex-1 truncate">
                        {OUTCOME_LABELS[o.outcome] || o.outcome}
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-white tabular-nums">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Row 4: Sentiment + Connect Rate ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Sentiment */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4">
            <p className="font-semibold text-slate-800 dark:text-white text-sm">Borrower Sentiment</p>
            <p className="text-xs text-slate-400 mt-0.5">
              How borrowers felt during calls — detected by AI in real time
            </p>
          </div>
          {sentiment.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
              No sentiment data yet — make some calls first
            </div>
          ) : (
            <div className="space-y-3">
              {sentiment.map(s => {
                const total = sentiment.reduce((acc, x) => acc + x.count, 0)
                const pct = total > 0 ? Math.round(s.count / total * 100) : 0
                return (
                  <div key={s.sentiment} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SENTIMENT_COLORS[s.sentiment] || '#94a3b8' }} />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize w-20 flex-shrink-0">{s.sentiment}</span>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: SENTIMENT_COLORS[s.sentiment] || '#94a3b8' }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-white w-12 text-right tabular-nums">
                      {s.count} ({pct}%)
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Performance summary */}
        <div className="card p-5">
          <div className="mb-4">
            <p className="font-semibold text-slate-800 dark:text-white text-sm">Performance Summary</p>
            <p className="text-xs text-slate-400 mt-0.5">Key efficiency metrics</p>
          </div>
          <div className="space-y-4">
            {[
              {
                label: 'Recovery Rate',
                value: `${stats?.recovery_rate ?? d.outcomes.recovery_rate_percent}%`,
                desc: 'Promises ÷ completed calls',
                color: '#10b981',
                pct: stats?.recovery_rate ?? d.outcomes.recovery_rate_percent,
              },
              {
                label: 'Connect Rate',
                value: `${stats?.connect_rate ?? 0}%`,
                desc: 'Completed ÷ total dialled',
                color: '#6366f1',
                pct: stats?.connect_rate ?? 0,
              },
              {
                label: 'Escalation Rate',
                value: `${stats?.escalation_rate ?? 0}%`,
                desc: 'Calls passed to humans',
                color: stats?.escalation_rate && stats.escalation_rate > 15 ? '#f43f5e' : '#f59e0b',
                pct: stats?.escalation_rate ?? 0,
              },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{m.label}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white tabular-nums">{m.value}</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(m.pct, 100)}%`, background: m.color }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
