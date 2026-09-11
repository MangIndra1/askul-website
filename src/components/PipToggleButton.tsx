'use client'

import { useFocusTimer } from '@/context/FocusTimerContext'

function IconPip({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <rect x="12" y="11" width="7" height="5" rx="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function PipToggleButton() {
  const { isPipSupported, isPipActive, openPip, closePip } = useFocusTimer()

  if (!isPipSupported) return null

  return (
    <button
      onClick={isPipActive ? closePip : openPip}
      title={isPipActive ? 'Tutup jendela mengambang' : 'Buka timer di jendela mengambang'}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
        isPipActive
          ? 'bg-[var(--lav-600)] text-white'
          : 'bg-white/[0.06] text-[var(--dk-text-soft)] hover:bg-white/[0.1]'
      }`}
    >
      <IconPip className="h-4 w-4" />
    </button>
  )
}