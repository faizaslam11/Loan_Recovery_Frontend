'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, PhoneCall, BarChart3,
  HeadphonesIcon, Bot, X, ChevronRight
} from 'lucide-react'

const nav = [
  { href: '/',            label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/customers',   label: 'Customers',  icon: Users },
  { href: '/calls',       label: 'Calls',      icon: PhoneCall },
  { href: '/analytics',   label: 'Analytics',  icon: BarChart3 },
  { href: '/support',     label: 'Support',    icon: HeadphonesIcon },
]

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed left-0 top-0 h-full w-64 z-30 flex flex-col',
        'bg-white dark:bg-gray-950 border-r border-slate-100 dark:border-slate-800',
        'transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center shadow-sm">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-sm text-slate-900 dark:text-white leading-none">LoanRecovery</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">AI Agent v1.0</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="section-label px-3 mb-3">Main Menu</p>
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== '/' && path.startsWith(href))
            return (
              <Link key={href} href={href} className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                active
                  ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              )}>
                <Icon size={17} className={active ? 'text-brand-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={14} className="text-brand-400" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">AI</div>
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Agent: Priya</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Active</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
