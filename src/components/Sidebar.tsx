'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/auth/actions'

type Profile = {
  display_name: string
  avatar_url: string | null
} | null

const NAV_ITEMS = [
  { label: 'Today', href: '/', icon: IconHome },
  { label: 'Constellation', href: '/constellation', icon: IconStar },
  { label: 'Tasks', href: '/tasks', icon: IconTasks },
  { label: 'Focus', href: '/focus', icon: IconTarget },
  { label: 'Journal', href: '/journal', icon: IconBook },
  { label: 'Calendar', href: '/calendar', icon: IconCalendar },
  { label: 'Stats', href: '/stats', icon: IconChart },
]

function IconHome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-9 9 9M5 10v10h14V10" />
    </svg>
  )
}
function IconStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l2.4 5.4L20 9.3l-4 3.9.9 5.8L12 16.3l-4.9 2.7.9-5.8-4-3.9 5.6-.9L12 3Z" />
    </svg>
  )
}
function IconTarget({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function IconBook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2Z" />
    </svg>
  )
}
function IconCalendar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}
function IconTasks({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 6 1.5 1.5L8 5" /><path d="M11 6h9" />
      <path d="m4 12 1.5 1.5L8 11" /><path d="M11 12h9" />
      <path d="m4 18 1.5 1.5L8 17" /><path d="M11 18h9" />
    </svg>
  )
}
function IconChart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M12 20V4M20 20v-7" />
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

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()

  return (
    <aside className="glass flex w-full flex-col gap-6 rounded-[28px] p-5 lg:w-[230px] lg:shrink-0">
      <div className="flex items-center gap-2.5 px-1 pt-1">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl">
          <Image src="/logo.png" alt="AsKul" fill className="object-cover" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-[var(--dk-text)]">AsKul</span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-gradient-to-br from-[var(--lav-400)]/20 to-[var(--pink-400)]/15 text-[var(--dk-text)] ring-1 ring-white/[0.08]'
                  : 'text-[var(--dk-text-soft)] hover:bg-white/[0.06]'
              }`}
              style={active ? { boxShadow: '0 0 16px rgba(167,139,250,0.25)' } : undefined}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <div className="glass-soft flex items-center gap-3 rounded-2xl p-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--lav-400)] to-[var(--pink-400)] text-sm font-semibold text-white">
            {(profile?.display_name ?? '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--dk-text)]">
              {profile?.display_name ?? 'Pengguna'}
            </p>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-[var(--dk-text-soft)] transition hover:bg-white/[0.06]"
          >
            <IconLogout className="h-[18px] w-[18px]" />
            <span>Keluar</span>
          </button>
        </form>
      </div>
    </aside>
  )
}