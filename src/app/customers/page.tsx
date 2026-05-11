'use client'
import { useEffect, useState } from 'react'
import { getCustomers, triggerCall, deleteCustomer, Customer } from '@/lib/api'
import { formatCurrency, riskColor, cn } from '@/lib/utils'
import {
  Phone, Plus, Search, Filter, Trash2, PhoneCall,
  ChevronRight, AlertCircle, Check, X
} from 'lucide-react'
import Link from 'next/link'

const RISK_OPTIONS = ['', 'low', 'medium', 'high', 'critical']
const LANG_FLAGS: Record<string, string> = {
  hindi: '🇮🇳', english: '🇬🇧', tamil: '🏳️', telugu: '🏳️',
  marathi: '🇮🇳', bengali: '🏳️', kannada: '🏳️', gujarati: '🇮🇳', hinglish: '🇮🇳'
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [calling, setCalling] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getCustomers(0, 100, riskFilter || undefined)
      setCustomers(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [riskFilter])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleCall = async (c: Customer) => {
    if (c.is_dnc) return showToast('Customer is on DNC list', 'error')
    if (!c.consent_given) return showToast('Customer has not given consent', 'error')
    setCalling(c.id)
    try {
      await triggerCall(c.id)
      showToast(`📞 Call initiated to ${c.name}`)
    } catch (e: any) {
      showToast(e.message || 'Call failed', 'error')
    } finally {
      setCalling(null)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}?`)) return
    try {
      await deleteCustomer(id)
      setCustomers(cs => cs.filter(c => c.id !== id))
      showToast('Customer deleted')
    } catch {
      showToast('Delete failed', 'error')
    }
  }

  const filtered = customers.filter(c =>
    search === '' ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.loan_account_number.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up',
          toast.type === 'success'
            ? 'bg-emerald-500 text-white'
            : 'bg-rose-500 text-white'
        )}>
          {toast.type === 'success' ? <Check size={15} /> : <X size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Customers</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{customers.length} borrowers in system</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, phone, loan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-slate-400" />
          <select
            className="input w-auto py-2"
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
          >
            {RISK_OPTIONS.map(r => (
              <option key={r} value={r}>{r ? r.charAt(0).toUpperCase() + r.slice(1) : 'All Risk Levels'}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Customer', 'Loan Account', 'Outstanding', 'DPD', 'Risk', 'Lang', 'Last Outcome', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <AlertCircle size={28} className="mx-auto mb-2 opacity-30" />
                    No customers found
                  </td>
                </tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400">
                        {c.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{c.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{c.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{c.loan_account_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">{formatCurrency(c.outstanding_amount)}</span>
                    <p className="text-xs text-slate-400">EMI: {formatCurrency(c.emi_amount)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-sm font-bold', c.days_past_due >= 90 ? 'text-rose-600 dark:text-rose-400' : c.days_past_due >= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300')}>
                      {c.days_past_due}d
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('badge', riskColor(c.risk_level))}>
                      {c.risk_level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{LANG_FLAGS[c.language_preference] || '🌐'} {c.language_preference}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {c.last_call_outcome?.replace(/_/g, ' ') || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCall(c)}
                        disabled={calling === c.id || c.is_dnc}
                        className={cn(
                          'p-2 rounded-lg transition-all',
                          c.is_dnc
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:bg-brand-50 dark:hover:bg-brand-950/40 text-brand-500 hover:text-brand-600'
                        )}
                        title={c.is_dnc ? 'DNC - Cannot call' : 'Trigger AI call'}
                      >
                        {calling === c.id
                          ? <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                          : <Phone size={15} />
                        }
                      </button>
                      <Link href={`/customers/${c.id}`} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <ChevronRight size={15} />
                      </Link>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-400 hover:text-rose-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAdd && <AddCustomerModal onClose={() => { setShowAdd(false); load() }} />}
    </div>
  )
}

function AddCustomerModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: '', phone: '', loan_account_number: '', outstanding_amount: '',
    emi_amount: '', days_past_due: '0', language_preference: 'hindi', consent_given: true
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.loan_account_number) {
      setError('Name, phone and loan account are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { createCustomer } = await import('@/lib/api')
      await createCustomer({
        ...form,
        outstanding_amount: parseFloat(form.outstanding_amount),
        emi_amount: parseFloat(form.emi_amount),
        days_past_due: parseInt(form.days_past_due),
      })
      onClose()
    } catch (e: any) {
      setError(e.message || 'Failed to create customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-display font-bold text-slate-900 dark:text-white">Add Customer</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} className="text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Full Name *</label>
              <input className="input" placeholder="Rahul Sharma" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Phone *</label>
              <input className="input" placeholder="+91817107785" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Loan Account *</label>
              <input className="input" placeholder="LN-2024-001" value={form.loan_account_number} onChange={e => set('loan_account_number', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Days Past Due</label>
              <input className="input" type="number" value={form.days_past_due} onChange={e => set('days_past_due', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Outstanding (₹)</label>
              <input className="input" type="number" placeholder="85000" value={form.outstanding_amount} onChange={e => set('outstanding_amount', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">EMI Amount (₹)</label>
              <input className="input" type="number" placeholder="8500" value={form.emi_amount} onChange={e => set('emi_amount', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Language</label>
              <select className="input" value={form.language_preference} onChange={e => set('language_preference', e.target.value)}>
                {['hindi','english','tamil','telugu','marathi','bengali','kannada','gujarati','hinglish'].map(l => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="consent" checked={form.consent_given} onChange={e => set('consent_given', e.target.checked)} className="rounded" />
              <label htmlFor="consent" className="text-sm text-slate-600 dark:text-slate-400">Customer has given consent to be contacted</label>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Add Customer'}
          </button>
        </div>
      </div>
    </div>
  )
}
