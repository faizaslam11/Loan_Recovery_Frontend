'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'error' | 'success' | 'warning' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
  detail?: string
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, detail?: string) => void
  showError: (error: unknown) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info', detail?: string) => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type, detail }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5000)
  }, [])

  // Parses any error — fetch response, Error object, string, unknown
const showError = useCallback((error: unknown) => {
  if (error instanceof Error) {
    const msg = error.message
    // Map known backend messages to friendly UI text
    if (msg.includes('calling hours') || msg.includes('8 AM') || msg.includes('7 PM') || msg.includes('time')) {
      showToast('Outside Calling Hours', 'warning', 'RBI permits calls only between 8AM–7PM IST')
    } else if (msg.includes('DNC') || msg.includes('dnc')) {
      showToast('DNC List', 'error', 'This customer is on the Do Not Call list')
    } else if (msg.includes('calls today') || msg.includes('maximum') || msg.includes('limit')) {
      showToast('Call Limit Reached', 'warning', 'Maximum 3 calls per borrower per day (RBI)')
    } else if (msg.includes('consent')) {
      showToast('No Consent', 'error', 'Customer has not given consent to be contacted')
    } else if (msg.includes('Telephony') || msg.includes('Twilio') || msg.includes('400 Bad Request')) {
      showToast('Call Failed', 'error', 'Twilio error — check phone number format (+91XXXXXXXXXX)')
    } else if (msg.includes('Network') || msg.includes('fetch')) {
      showToast('Network Error', 'error', 'Cannot reach server — check your connection')
    } else if (msg.includes('verified') || msg.includes('trial')) {
      showToast('Twilio Trial Restriction', 'warning', 'Number must be verified in Twilio console')
    } else {
      // Show the raw backend message — it's already clean from request()
      showToast('Error', 'error', msg)
    }
  } else if (typeof error === 'string') {
    showToast('Error', 'error', error)
  } else {
    showToast('Unexpected Error', 'error', 'Something went wrong')
  }
}, [showToast])


  return (
    <ToastContext.Provider value={{ showToast, showError }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => setToasts(t => t.filter(x => x.id !== toast.id))}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const icons: Record<ToastType, string> = {
    error:   '❌',
    success: '✅',
    warning: '⚠️',
    info:    'ℹ️',
  }

  const colors: Record<ToastType, string> = {
    error:   'bg-rose-600 border-rose-500',
    success: 'bg-emerald-600 border-emerald-500',
    warning: 'bg-amber-500 border-amber-400',
    info:    'bg-slate-700 border-slate-600',
  }

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border text-white text-sm max-w-sm animate-slide-up ${colors[toast.type]}`}
    >
      <span className="text-base shrink-0 mt-0.5">{icons[toast.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold leading-snug">{toast.message}</p>
        {toast.detail && (
          <p className="text-xs opacity-80 mt-0.5 leading-snug break-words">{toast.detail}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity text-white text-lg leading-none mt-0.5"
      >
        ×
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}