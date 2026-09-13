'use client'

import { useState } from 'react'
import { disconnectGoogleCalendar } from '@/app/actions/googleCalendar'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

function IconGoogle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
function IconRefresh({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" />
    </svg>
  )
}
function IconLogout({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

export function GoogleAccountMenu({ email, redirectUri }: { email: string | null; redirectUri: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const switchAccountUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'select_account consent',
  }).toString()}`

  async function handleDisconnect() {
    setDisconnecting(true)
    await disconnectGoogleCalendar()
    setDisconnecting(false)
    setMenuOpen(false)
  }

  return (
    <div className="relative w-full">
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="glass flex w-full items-center gap-2.5 rounded-2xl px-4 py-3.5 text-left transition hover:bg-white/[0.06]"
      >
        <IconGoogle className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--dk-text)]">
          {email ?? 'Google Calendar terhubung'}
        </span>
        <IconChevronDown className="h-4 w-4 shrink-0 text-[var(--dk-text-faint)]" />
      </button>

      {menuOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-[18px] border border-white/10 bg-[rgba(23,28,55,0.97)] p-2 shadow-xl backdrop-blur-xl">
          <a
            href={switchAccountUrl}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-[var(--dk-text)] transition hover:bg-white/[0.06]"
          >
            <IconRefresh className="h-4 w-4" />
            Ganti akun
          </a>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-red-400 transition hover:bg-white/[0.06] disabled:opacity-50"
          >
            <IconLogout className="h-4 w-4" />
            {disconnecting ? 'Memutuskan...' : 'Putuskan koneksi'}
          </button>
        </div>
      )}
    </div>
  )
}