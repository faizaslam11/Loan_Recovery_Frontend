'use client'
import { useEffect, useState } from 'react'
import { getDashboard, getCallsByOutcome, getCallsByDay, getSentimentDist, DashboardData, OutcomeData, DayData, SentimentData } from '@/lib/api'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const OUTCOME_COLORS: Record<string, string> = {
  promise_to_pay: '#10b981', already_paid: '#059669',
  refused: '#f43f5e', escalated: '#f59e0b',
  callback_requested: '#0c8fe7', abusive: '#dc2626', incomplete: '#94a3b8',
}
const SENTIMENT_COLORS: Record<string, string> = {
  cooperative: '#10b981', neutral: '#0c8fe7', distressed: '#f59e0b', angry: '#f43f5e',
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [outcomes, setOutcomes] = useState<OutcomeData[]>([])
  const [byDay7, setByDay7] = useState<DayData[]>([])
  const [byDay30, setByDay30] = useState<DayData[]>([])
  const [sentiment, setSentiment] = useState<SentimentData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboard(), getCallsByOutcome(), getCallsByDay(7), getCallsByDay(30), getSentimentDist()])
      .then(([d, o, d7, d30, s]) => {
        setData(d); setOutcomes(o); setByDay7(d7); setByDay30(d30); setSentiment(s)
        setLoading(false)
      })
  }, [])

  if (loading || !data) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const recoveryGood = data.outcomes.recovery_rate_percent >= 30

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="page-title">Analytics</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Performance metrics and trends</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Recovery Rate', value: `${data.outcomes.recovery_rate_percent}%`, good: recoveryGood, sub: 'Promise to pay / total calls' },
          { label: 'Total Calls', value: data.calls.total, good: true, sub: `${data.calls.this_week} this week` },
          { label: 'Escalations', value: data.outcomes.escalated, good: data.outcomes.escalated === 0, sub: 'Human handoff needed' },
          { label: 'Already Paid', value: data.outcomes.already_paid, good: true, sub: 'Self-resolved before call' },
        ].map(k => (
          <div key={k.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{k.label}</p>
              {k.good
                ? <TrendingUp size={15} className="text-emerald-500" />
                : <TrendingDown size={15} className="text-rose-500" />
              }
            </div>
            <p className="text-3xl font-display font-bold text-slate-900 dark:text-white">{k.value}</p>
            <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* 30-day trend */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-slate-800 dark:text-white text-sm">Call Volume — 30 Days</p>
            <p className="text-xs text-slate-400 mt-0.5">Daily outbound call count</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={byDay30}>
            <defs>
              <linearGradient id="grad30" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0c8fe7" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0c8fe7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Area type="monotone" dataKey="count" stroke="#0c8fe7" strokeWidth={2.5} fill="url(#grad30)" name="Calls" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Outcomes + Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="font-semibold text-slate-800 dark:text-white text-sm mb-4">Outcomes Breakdown</p>
          {outcomes.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No call outcomes yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={outcomes} dataKey="count" nameKey="outcome" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                    {outcomes.map((o, i) => <Cell key={i} fill={OUTCOME_COLORS[o.outcome] || '#94a3b8'} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, String(n).replace(/_/g, ' ')]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend formatter={v => String(v).replace(/_/g, ' ')} iconSize={8} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {outcomes.map(o => {
                  const total = outcomes.reduce((s, x) => s + x.count, 0)
                  const pct = total > 0 ? Math.round(o.count / total * 100) : 0
                  return (
                    <div key={o.outcome} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: OUTCOME_COLORS[o.outcome] || '#94a3b8' }} />
                      <span className="text-xs text-slate-600 dark:text-slate-400 flex-1 capitalize">{o.outcome.replace(/_/g, ' ')}</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{o.count} ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className="card p-5">
          <p className="font-semibold text-slate-800 dark:text-white text-sm mb-4">Customer Sentiment</p>
          {sentiment.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No sentiment data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sentiment}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                  <XAxis dataKey="sentiment" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Customers">
                    {sentiment.map((s, i) => <Cell key={i} fill={SENTIMENT_COLORS[s.sentiment] || '#94a3b8'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {sentiment.map(s => (
                  <div key={s.sentiment} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: SENTIMENT_COLORS[s.sentiment] || '#94a3b8' }} />
                      <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">{s.sentiment}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
