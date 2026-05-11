'use client'
import { Sun, Moon, Menu, Bell, RefreshCw } from 'lucide-react'
import { usePathname } from 'next/navigation'

const titles: Record<string, string> = {
  '/':          'Dashboard',
  '/customers': 'Customers',
  '/calls':     'Call Logs',
  '/analytics': 'Analytics',
  '/support':   'Support',
}

export default function Topbar({
  dark, onToggleTheme, onToggleSidebar
}: {
  dark: boolean
  onToggleTheme: () => void
  onToggleSidebar: () => void
}) {
  const path = usePathname()
  const title = Object.entries(titles).find(([k]) => path === k || (k !== '/' && path.startsWith(k)))?.[1] || 'Dashboard'

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-gray-950 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu size={18} className="text-slate-500 dark:text-slate-400" />
        </button>
        <h1 className="font-display font-bold text-lg text-slate-900 dark:text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Refresh */}
        <button
          onClick={() => window.location.reload()}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Refresh data"
        >
          <RefreshCw size={16} className="text-slate-400" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell size={16} className="text-slate-400" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
          <span className="hidden sm:inline">{dark ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </header>
  )
}
