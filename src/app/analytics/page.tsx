'use client'
import { useEffect, useState } from 'react'
import {
  getDashboard, getCallsByOutcome, getCallsByDay, getSentimentDist,
  DashboardData, OutcomeData, DayData, SentimentData
} from '@/lib/api'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, Line
} from 'recharts'
import {
  TrendingUp, TrendingDown, Phone, PhoneOff, AlertTriangle,
  CheckCircle2, Clock, Users, ArrowUpRight, ArrowDownRight,
  Target, Activity, Globe, Calendar
} from 'lucide-react'
import { formatDuration, cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────
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

interface HourData { hour: number; label: string; count: number; promises: number; conversion: number }
interface LangData  { language: string; count: number }
interface PromiseData { week: string; promises: number; links_sent: number; total: number; promise_rate: number }

// ── Colors ─────────────────────────────────────────────────────────────────
const OUTCOME_COLORS: Record<string, string> = {
  promise_to_pay:     '#10b981',
  already_paid:       '#059669',
  refused:            '#f43f5e',
  escalated:          '#f59e0b',
  callback_requested: '#6366f1',
  abusive:            '#dc2626',
  incomplete:         '#94a3b8',
}

const SENTIMENT_COLORS: Record<string, string> = {
  cooperative: '#10b981',
  neutral:     '#6366f1',
  distressed:  '#f59e0b',
  angry:       '#f43f5e',
}

const OUTCOME_LABELS: Record<string, string> = {
  promise_to_pay:     'Promise to Pay',
  already_paid:       'Already Paid',
  refused:            'Refused',
  escalated:          'Escalated',
  callback_requested: 'Callback Requested',
  abusive:            'Abusive',
  incomplete:         'Incomplete',
}

// ── API helpers ─────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || 'https://loan-recovery-api.onrender.com'

async function fetchJSON(path: string) {
  const r = await fetch(`${API}${path}`)
  if (!r.ok) return null
  return r.json()
}

// ── Tooltip ────────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2.5 shadow-lg text-xs">
      {label && <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
          <span className="font-semibold text-slate-700 dark:text-white">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Metric Card ────────────────────────────────────────────────────────────
function MetricCard({
  label, value, sub, icon: Icon, color = 'slate', trend, trendLabel, tooltip
}: {
  label: string; value: string | number; sub?: string
  icon?: any; color?: string; trend?: number; trendLabel?: string; tooltip?: string
}) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40',
    rose:    'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40',
    amber:   'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40',
    brand:   'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/40',
    violet:  'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/40',
    slate:   'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800',
  }
  return (
    <div className="card p-5 group" title={tooltip}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{label}</p>
          <p className="text-2xl font-display font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1 truncate">{sub}</p>}
          {trend !== undefined && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs font-medium',
              trend >= 0 ? 'text-emerald-600' : 'text-rose-600'
            )}>
              {trend >= 0
                ? <ArrowUpRight size={12} />
                : <ArrowDownRight size={12} />
              }
              {Math.abs(trend)}% {trendLabel || 'vs last week'}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3', colorMap[color])}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{title}</h3>
      <p className="text-xs text-slate-400 mt-0.5">{description}</p>
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm">
      <Activity size={28} className="mb-2 opacity-30" />
      {message}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [stats, setStats]         = useState<TopStats | null>(null)
  const [outcomes, setOutcomes]   = useState<OutcomeData[]>([])
  const [byDay30, setByDay30]     = useState<DayData[]>([])
  const [byDay7, setByDay7]       = useState<DayData[]>([])
  const [sentiment, setSentiment] = useState<SentimentData[]>([])
  const [hourly, setHourly]       = useState<HourData[]>([])
  const [languages, setLanguages] = useState<LangData[]>([])
  const [promises, setPromises]   = useState<PromiseData[]>([])
  const [loading, setLoading]     = useState(true)
  const [range, setRange]         = useState<7 | 30>(7)

  useEffect(() => {
    Promise.all([
      fetchJSON('/analytics/top-stats'),
      getCallsByOutcome(),
      getCallsByDay(7),
      getCallsByDay(30),
      getSentimentDist(),
      fetchJSON('/analytics/hourly-distribution'),
      fetchJSON('/analytics/language-breakdown'),
      fetchJSON('/analytics/promise-conversion'),
    ]).then(([s, o, d7, d30, sent, h, l, p]) => {
      setStats(s)
      setOutcomes(o || [])
      setByDay7(d7 || [])
      setByDay30(d30 || [])
      setSentiment(sent || [])
      setHourly(h || [])
      setLanguages(l || [])
      setPromises(p || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!stats) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
      Failed to load analytics. Try refreshing.
    </div>
  )

  const chartData = range === 7 ? byDay7 : byDay30

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="page-title">Analytics</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track recovery performance, call quality, and borrower behaviour
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {([7, 30] as const).map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                range === d
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 1: Core KPIs ── */}
      <section>
        <SectionHeader
          title="Recovery Overview"
          description="How well the AI agent is converting calls into payment commitments"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Recovery Rate"
            value={`${stats.recovery_rate}%`}
            sub="Promises ÷ completed calls"
            icon={Target}
            color="emerald"
            tooltip="Percentage of completed calls where borrower committed to pay"
          />
          <MetricCard
            label="Connect Rate"
            value={`${stats.connect_rate}%`}
            sub="Completed ÷ total dialled"
            icon={Phone}
            color="brand"
            tooltip="Percentage of calls that connected and completed"
          />
          <MetricCard
            label="Promise to Pay"
            value={stats.promise_to_pay}
            sub={`${stats.already_paid} already paid`}
            icon={CheckCircle2}
            color="emerald"
            tooltip="Borrowers who committed to a payment date"
          />
          <MetricCard
            label="Avg Call Duration"
            value={formatDuration(stats.avg_duration_seconds)}
            sub={`${stats.completed_calls} completed calls`}
            icon={Clock}
            color="amber"
            tooltip="Average time spent per completed call"
          />
        </div>
      </section>

      {/* ── Section 2: Volume + Trend ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            title="Call Volume Trend"
            description={`Daily outbound call count over the last ${range} days`}
          />
        </div>
        <div className="card p-5">
          {chartData.length === 0 ? (
            <EmptyState message="No call data for this period yet" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5}
                  fill="url(#volGrad)" name="Calls" dot={{ fill: '#6366f1', r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ── Section 3: Outcomes + Sentiment ── */}
      <section>
        <SectionHeader
          title="Call Outcomes & Sentiment"
          description="What happened on each call and how borrowers responded emotionally"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Outcomes donut */}
          <div className="card p-5">
            <p className="font-semibold text-slate-800 dark:text-white text-sm mb-1">Outcome Breakdown</p>
            <p className="text-xs text-slate-400 mb-4">Distribution of how calls ended</p>
            {outcomes.length === 0 ? (
              <EmptyState message="Make some calls to see outcome data" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={outcomes} dataKey="count" nameKey="outcome"
                      cx="50%" cy="50%" outerRadius={85} innerRadius={52}
                      paddingAngle={2}
                    >
                      {outcomes.map((o, i) => (
                        <Cell key={i} fill={OUTCOME_COLORS[o.outcome] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: any, n: any) => [v, OUTCOME_LABELS[n] || n]}
                      content={<ChartTooltip />}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                  {outcomes.map(o => {
                    const total = outcomes.reduce((s, x) => s + x.count, 0)
                    const pct = total > 0 ? Math.round(o.count / total * 100) : 0
                    return (
                      <div key={o.outcome} className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: OUTCOME_COLORS[o.outcome] || '#94a3b8' }} />
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate flex-1">
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

          {/* Sentiment bars */}
          <div className="card p-5">
            <p className="font-semibold text-slate-800 dark:text-white text-sm mb-1">Borrower Sentiment</p>
            <p className="text-xs text-slate-400 mb-4">How borrowers felt during calls — detected by AI</p>
            {sentiment.length === 0 ? (
              <EmptyState message="No sentiment data yet" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sentiment} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="sentiment" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} width={75} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Calls" maxBarSize={32}>
                      {sentiment.map((s, i) => (
                        <Cell key={i} fill={SENTIMENT_COLORS[s.sentiment] || '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {sentiment.map(s => {
                    const total = sentiment.reduce((acc, x) => acc + x.count, 0)
                    const pct = total > 0 ? Math.round(s.count / total * 100) : 0
                    return (
                      <div key={s.sentiment} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SENTIMENT_COLORS[s.sentiment] || '#94a3b8' }} />
                        <span className="text-xs text-slate-500 dark:text-slate-400 capitalize w-24">{s.sentiment}</span>
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: SENTIMENT_COLORS[s.sentiment] || '#94a3b8' }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-white w-8 text-right tabular-nums">{s.count}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 4: Best Calling Hours ── */}
      <section>
        <SectionHeader
          title="Best Time to Call"
          description="Call volume and promise-to-pay conversion by hour — use this to schedule your campaigns"
        />
        <div className="card p-5">
          {hourly.length === 0 ? (
            <EmptyState message="Not enough data yet to show hourly patterns" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={hourly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="count" name="Calls" fill="#e0e7ff" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar yAxisId="left" dataKey="promises" name="Promises" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line yAxisId="right" type="monotone" dataKey="conversion" name="Convert %" stroke="#10b981" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-400 mt-3 text-center">
                💡 Hours with high conversion % and good call volume are your best calling windows
              </p>
            </>
          )}
        </div>
      </section>

      {/* ── Section 5: Language + Escalation ── */}
      <section>
        <SectionHeader
          title="Language & Escalation"
          description="Which languages are being used and how often calls escalate to human agents"
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Language breakdown */}
          <div className="card p-5">
            <p className="font-semibold text-slate-800 dark:text-white text-sm mb-1">Languages Used</p>
            <p className="text-xs text-slate-400 mb-4">Calls by language — helps identify coverage gaps</p>
            {languages.length === 0 ? (
              <EmptyState message="No language data yet" />
            ) : (
              <div className="space-y-3 mt-2">
                {languages.map(l => {
                  const total = languages.reduce((s, x) => s + x.count, 0)
                  const pct = total > 0 ? Math.round(l.count / total * 100) : 0
                  return (
                    <div key={l.language}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <Globe size={12} className="text-slate-400" />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">{l.language}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{l.count} calls ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <MetricCard
              label="Escalation Rate"
              value={`${stats.escalation_rate}%`}
              sub={`${stats.escalated} calls escalated`}
              icon={AlertTriangle}
              color={stats.escalation_rate > 15 ? 'rose' : 'amber'}
              tooltip="Calls where AI couldn't resolve and passed to human. Under 10% is healthy."
            />
            <MetricCard
              label="Callbacks Requested"
              value={stats.callback_requested}
              sub="Borrowers asked to call back"
              icon={Phone}
              color="violet"
              tooltip="Borrowers who weren't available but requested a callback"
            />
            <MetricCard
              label="This Week's Calls"
              value={stats.this_week_calls}
              sub={`vs ${stats.last_week_calls} last week`}
              icon={Calendar}
              color="brand"
              trend={stats.week_change_percent}
            />
            <MetricCard
              label="Total Calls Made"
              value={stats.total_calls}
              sub={`${stats.completed_calls} completed`}
              icon={Activity}
              color="slate"
            />
          </div>
        </div>
      </section>

      {/* ── Section 6: Promise Conversion ── */}
      {promises.length > 0 && (
        <section>
          <SectionHeader
            title="Weekly Promise Capture"
            description="How many payment commitments were captured each week"
          />
          <div className="card p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={promises} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="total" name="Total Calls" fill="#e2e8f0" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="promises" name="Promises" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

    </div>
  )
}
