const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export const getDashboard = () => request<DashboardData>('/analytics/dashboard')
export const getCallsByOutcome = () => request<OutcomeData[]>('/analytics/calls-by-outcome')
export const getCallsByDay = (days = 7) => request<DayData[]>(`/analytics/calls-by-day?days=${days}`)
export const getSentimentDist = () => request<SentimentData[]>('/analytics/sentiment-distribution')

// ── Customers ──────────────────────────────────────────────────────────────
export const getCustomers = (skip = 0, limit = 50, risk?: string) =>
  request<Customer[]>(`/customers/?skip=${skip}&limit=${limit}${risk ? `&risk_level=${risk}` : ''}`)

export const getCustomer = (id: string) => request<Customer>(`/customers/${id}`)

export const createCustomer = (data: Partial<Customer>) =>
  request<Customer>('/customers/', { method: 'POST', body: JSON.stringify(data) })

export const updateCustomer = (id: string, data: Partial<Customer>) =>
  request<Customer>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteCustomer = (id: string) =>
  request(`/customers/${id}`, { method: 'DELETE' })

// ── Calls ──────────────────────────────────────────────────────────────────
export const getCalls = (skip = 0, limit = 50, customerId?: string) =>
  request<Call[]>(`/calls/?skip=${skip}&limit=${limit}${customerId ? `&customer_id=${customerId}` : ''}`)

export const getCall = (id: string) => request<Call>(`/calls/${id}`)

export const getTranscript = (callId: string) =>
  request<TranscriptEntry[]>(`/calls/${callId}/transcript`)

export const triggerCall = (customerId: string, language?: string) =>
  request<{ call_id: string; status: string }>('/calls/trigger', {
    method: 'POST',
    body: JSON.stringify({ customer_id: customerId, override_language: language }),
  })

// ── Types ──────────────────────────────────────────────────────────────────
export interface DashboardData {
  customers: { total: number; high_risk: number; critical: number }
  calls: { total: number; today: number; this_week: number; completed: number; avg_duration_seconds: number }
  outcomes: { promise_to_pay: number; refused: number; escalated: number; already_paid: number; recovery_rate_percent: number }
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  loan_account_number: string
  outstanding_amount: number
  emi_amount: number
  days_past_due: number
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  language_preference: string
  is_dnc: boolean
  consent_given: boolean
  total_calls_made: number
  last_call_outcome?: string
  created_at: string
}

export interface Call {
  id: string
  customer_id: string
  status: string
  outcome?: string
  language_used: string
  duration_seconds: number
  sentiment_label?: string
  sentiment_score?: number
  promise_date?: string
  promise_amount?: number
  payment_link_sent: boolean
  escalated_to_human: boolean
  recording_url?: string
  initiated_at?: string
  completed_at?: string
  created_at: string
}

export interface TranscriptEntry {
  speaker: string
  text: string
  intent?: string
  language?: string
  timestamp: string
}

export interface OutcomeData { outcome: string; count: number }
export interface DayData { day: string; count: number }
export interface SentimentData { sentiment: string; count: number }
