'use client'
import { useEffect, useState } from 'react'
import { getCustomers, triggerCall, deleteCustomer, Customer } from '@/lib/api'
import { formatCurrency, riskColor, cn } from '@/lib/utils'
import {
  Phone, Plus, Search, Filter, Trash2, Pencil,
  ChevronRight, AlertCircle, Check, X, Upload, Download
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/lib/toast'

const RISK_OPTIONS = ['', 'low', 'medium', 'high', 'critical']
// const LANG_FLAGS: Record<string, string> = {
//   hindi: '🇮🇳', english: '🇬🇧', tamil: '🏳️', telugu: '🏳️',
//   marathi: '🇮🇳', bengali: '🏳️', kannada: '🏳️', gujarati: '🇮🇳', hinglish: '🇮🇳'
// }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [calling, setCalling] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  // const [showAdd, setShowAdd] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const { showToast: globalToast, showError } = useToast()
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

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
  } catch (e) {
    showError(e)  // ← replaces generic e.message
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
    } catch (e) {
    showError(e)  // ← replaces generic 'Delete failed'
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
        <div className="flex items-center gap-2">
  <button onClick={() => setShowImport(true)} className="btn-secondary flex items-center gap-2">
    <Upload size={16} /> Import CSV
  </button>
  <button onClick={() => setShowAdd(true)} className="btn-primary">
    <Plus size={16} /> Add Customer
  </button>
</div>
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
                    {/* <span className="text-sm">{LANG_FLAGS[c.language_preference] || '🌐'} {c.language_preference}</span> */}
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      {c.language_preference?.slice(0, 2).toUpperCase()}
                    </span>
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
                      <button
                        onClick={() => setEditingCustomer(c)}
                        className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-400 hover:text-amber-600"
                        title="Edit customer"
                        >
                          <Pencil size={15} />
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
      {/* {showAdd && <AddCustomerModal onClose={() => { setShowAdd(false); load() }} />} */}
      {showAdd && <AddCustomerModal onClose={() => { setShowAdd(false); load() }} />}
      {showImport && <ImportCSVModal onClose={() => { setShowImport(false); load() }} />}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => { setEditingCustomer(null); load() }}
      />
      )}
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
      let msg = 'Failed to create customer'
      try { msg = JSON.parse(e.message)?.detail || e.message || msg } catch {}
      setError(msg)
      }
      finally {
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

function ImportCSVModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://loan-recovery-api.onrender.com'

  const downloadTemplate = () => {
  const csv = [
    'name,phone,loan_account_number,outstanding_amount,emi_amount,days_past_due,language_preference,consent_given',
    'Rahul Sharma,"+919876543210",LN-2024-001,85000,8500,30,hindi,true',
    'Priya Patel,"+918765432109",LN-2024-002,120000,12000,60,gujarati,true',
    'Amit Kumar,"+917654321098",LN-2024-003,45000,4500,90,hindi,true',
  ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'priyaai_customers_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleUpload = async () => {
  if (!file) return
  setStatus('uploading')
  setResult(null)
  try {
    // 1. Read CSV text from file
    const text = await file.text()
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())

    // 2. Parse rows into JSON objects
    const customers = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const row: Record<string, any> = {}
      headers.forEach((h, i) => { row[h] = values[i] })
      return {
        name: row.name,
        // phone: row.phone,
        // phone: (row.phone || '').trim().replace(/^'/, ''),
        phone: (() => {
        const raw = (row.phone || '').toString().trim().replace(/^['"]|['"]$/g, '')
          if (raw.includes('E+') || raw.includes('e+')) {
            return '+' + Math.round(parseFloat(raw)).toString()
          }
          return raw
          })(),
        loan_account_number: row.loan_account_number,
        outstanding_amount: parseFloat(row.outstanding_amount) || 0,
        emi_amount: parseFloat(row.emi_amount) || 0,
        days_past_due: parseInt(row.days_past_due) || 0,
        language_preference: row.language_preference || 'hindi',
        consent_given: row.consent_given === 'true',
      }
    }).filter(c => c.name && c.phone) // skip empty rows
    

    // 3. POST JSON array to existing endpoint
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://loan-recovery-api.onrender.com'
    const res = await fetch(`${API_URL}/customers/bulk-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customers),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Upload failed')
    }
    const data = await res.json()
    // Backend returns { created: N, skipped: N }
    setResult({ imported: data.created, errors: data.skipped > 0 ? [`${data.skipped} rows skipped (duplicate phones)`] : [] })
    setStatus('done')
  } catch (e: any) {
    setResult({ imported: 0, errors: [e.message || 'Upload failed'] })
    setStatus('error')
  }
}

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.name.endsWith('.csv')) setFile(dropped)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-display font-bold text-slate-900 dark:text-white">Import Customers</h3>
            <p className="text-xs text-slate-400 mt-0.5">Upload a CSV file to bulk-add borrowers</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Template download */}
          <button
            onClick={downloadTemplate}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Download size={16} className="text-slate-400 group-hover:text-brand-500 transition-colors" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Download template</p>
                <p className="text-xs text-slate-400">priyaai_customers_template.csv</p>
              </div>
            </div>
            <span className="text-xs text-brand-500 font-medium">Download</span>
          </button>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('csv-input')?.click()}
            className={cn(
              'relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all',
              dragOver
                ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/20'
                : file
                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            )}
          >
            <input
              id="csv-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <>
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-3">
                  <Check size={20} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{file.name}</p>
                <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB — click to change</p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <Upload size={20} className="text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Drop your CSV here</p>
                <p className="text-xs text-slate-400 mt-1">or click to browse</p>
              </>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className={cn(
              'rounded-xl px-4 py-3 text-sm',
              status === 'done'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
            )}>
              {status === 'done' && (
                <p className="font-medium">✓ {result.imported} customers imported successfully</p>
              )}
              {result.errors.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {result.errors.slice(0, 5).map((e, i) => (
                    <p key={i} className="text-xs opacity-80">• {e}</p>
                  ))}
                  {result.errors.length > 5 && (
                    <p className="text-xs opacity-60">...and {result.errors.length - 5} more errors</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="btn-secondary">
            {status === 'done' ? 'Done' : 'Cancel'}
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || status === 'uploading' || status === 'done'}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'uploading' ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Importing...
              </span>
            ) : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}
function EditCustomerModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [form, setForm] = useState({
    name: customer.name,
    phone: customer.phone,
    outstanding_amount: String(customer.outstanding_amount),
    emi_amount: String(customer.emi_amount),
    days_past_due: String(customer.days_past_due),
    language_preference: customer.language_preference,
    is_dnc: customer.is_dnc,
    consent_given: customer.consent_given,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    const phoneRegex = /^\+[1-9]\d{7,14}$/
    if (!phoneRegex.test(form.phone)) {
      setError('Phone must be in international format: +919876543210')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { updateCustomer } = await import('@/lib/api')
      await updateCustomer(customer.id, {
        ...form,
        outstanding_amount: parseFloat(form.outstanding_amount),
        emi_amount: parseFloat(form.emi_amount),
        days_past_due: parseInt(form.days_past_due),
      })
      onClose()
    } catch (e: any) {
      let msg = 'Failed to update customer'
      try { msg = JSON.parse(e.message)?.detail || e.message || msg } catch {}
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-display font-bold text-slate-900 dark:text-white">Edit Customer</h3>
            <p className="text-xs text-slate-400 mt-0.5">{customer.loan_account_number}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} className="text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Full Name</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Phone</label>
              <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Outstanding (₹)</label>
              <input className="input" type="number" value={form.outstanding_amount} onChange={e => set('outstanding_amount', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">EMI Amount (₹)</label>
              <input className="input" type="number" value={form.emi_amount} onChange={e => set('emi_amount', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Days Past Due</label>
              <input className="input" type="number" value={form.days_past_due} onChange={e => set('days_past_due', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Language</label>
              <select className="input" value={form.language_preference} onChange={e => set('language_preference', e.target.value)}>
                {['hindi','english','tamil','telugu','marathi','bengali','kannada','gujarati','hinglish'].map(l => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.consent_given} onChange={e => set('consent_given', e.target.checked)} className="rounded" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Consent given</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_dnc} onChange={e => set('is_dnc', e.target.checked)} className="rounded accent-rose-500" />
                <span className="text-sm text-rose-500">DNC (Do Not Call)</span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
