'use client'
import { useEffect, useState } from 'react'
import {
  getDashboard, getCallsByOutcome, getCallsByDay, getSentimentDist,
  DashboardData, OutcomeData, DayData, SentimentData
} from '@/lib/api'
import StatCard from '@/components/dashboard/StatCard'
import {
  Users, PhoneCall, TrendingUp, CheckCircle2,
  AlertTriangle, Clock, PhoneOff, Smile
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { formatCurrency, formatDuration } from '@/lib/utils'

const OUTCOME_COLORS: Record<string, string> = {
  promise_to_pay: '#10b981',
  already_paid:   '#059669',
  refused:        '#f43f5e',
  escalated:      '#f59e0b',
  callback_requested: '#0c8fe7',
  abusive:        '#dc2626',
  incomplete:     '#94a3b8',
}

const SENTIMENT_COLORS: Record<string, string> = {
  cooperative: '#10b981',
  neutral:     '#0c8fe7',
  distressed:  '#f59e0b',
  angry:       '#f43f5e',
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [outcomes, setOutcomes] = useState<OutcomeData[]>([])
  const [byDay, setByDay] = useState<DayData[]>([])
  const [sentiment, setSentiment] = useState<SentimentData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getDashboard(), getCallsByOutcome(), getCallsByDay(7), getSentimentDist()
    ]).then(([d, o, day, s]) => {
      setData(d); setOutcomes(o); setByDay(day); setSentiment(s)
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

  if (!data) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-slate-400">
        Failed to load dashboard data.
      </div>
    </div>
  )
}

const d = data

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Today's recovery performance at a glance
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-full">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">AI Agent Active</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Customers"
          value={d.customers.total}
          sub={`${d.customers.critical} critical`}
          icon={Users}
          color="brand"
        />
        <StatCard
          label="Calls Today"
          value={d.calls.today}
          sub={`${d.calls.this_week} this week`}
          icon={PhoneCall}
          color="brand"
        />
        <StatCard
          label="Recovery Rate"
          value={`${d.outcomes.recovery_rate_percent}%`}
          sub={`${d.outcomes.promise_to_pay} promises`}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          label="Avg Call Duration"
          value={formatDuration(d.calls.avg_duration_seconds)}
          sub={`${d.calls.completed} completed`}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Promise to Pay" value={d.outcomes.promise_to_pay} icon={CheckCircle2} color="emerald" />
        <StatCard label="Refused"         value={d.outcomes.refused}         icon={PhoneOff}    color="rose" />
        <StatCard label="Escalated"       value={d.outcomes.escalated}       icon={AlertTriangle} color="amber" />
        <StatCard label="Already Paid"    value={d.outcomes.already_paid}    icon={Smile}       color="emerald" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Calls by day */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-slate-800 dark:text-white text-sm">Calls — Last 7 Days</p>
              <p className="text-xs text-slate-400 mt-0.5">Daily call volume</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={byDay}>
              <defs>
                <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0c8fe7" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0c8fe7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#0c8fe7" strokeWidth={2} fill="url(#callGrad)" name="Calls" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Outcomes pie */}
        <div className="card p-5">
          <p className="font-semibold text-slate-800 dark:text-white text-sm mb-4">Call Outcomes</p>
          {outcomes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm">
              <PhoneCall size={32} className="mb-2 opacity-30" />
              No calls yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={outcomes} dataKey="count" nameKey="outcome" cx="50%" cy="50%" outerRadius={75} innerRadius={45}>
                  {outcomes.map((o, i) => (
                    <Cell key={i} fill={OUTCOME_COLORS[o.outcome] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n.replace(/_/g, ' ')]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend formatter={v => v.replace(/_/g, ' ')} iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Sentiment chart */}
      <div className="card p-5">
        <p className="font-semibold text-slate-800 dark:text-white text-sm mb-4">Sentiment Distribution</p>
        {sentiment.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No sentiment data yet — make some calls first!</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={sentiment} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis type="category" dataKey="sentiment" tick={{ fontSize: 11, fill: '#94a3b8' }} width={80} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Calls">
                {sentiment.map((s, i) => (
                  <Cell key={i} fill={SENTIMENT_COLORS[s.sentiment] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  )
}
