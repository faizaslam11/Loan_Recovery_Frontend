'use client'
import './globals.css'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') setDark(true)
  }, [])

  const toggleTheme = () => {
    setDark(d => {
      localStorage.setItem('theme', !d ? 'dark' : 'light')
      return !d
    })
  }

  return (
    <html lang="en" className={dark ? 'dark' : ''} suppressHydrationWarning>
      <head>
        <title>LoanRecovery AI — Dashboard</title>
        <meta name="description" content="AI-powered loan recovery management" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="bg-[var(--bg)] text-[var(--text)] min-h-screen flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <Topbar
            dark={dark}
            onToggleTheme={toggleTheme}
            onToggleSidebar={() => setSidebarOpen(o => !o)}
          />
          <main className="flex-1 p-6 animate-fade-in">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
