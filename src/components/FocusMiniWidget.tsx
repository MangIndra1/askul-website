'use client'

import { useFocusTimer } from '@/context/FocusTimerContext'
import { PipToggleButton } from '@/components/PipToggleButton'

function IconPlay({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  )
}
function IconPause({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <rect x="7" y="5" width="3.5" height="14" rx="1" /><rect x="13.5" y="5" width="3.5" height="14" rx="1" />
    </svg>
  )
}

export function FocusMiniWidget() {
  const { technique, activeMode, remaining, running, toggleRunning } = useFocusTimer()

  const minutesLabel = Math.floor(remaining / 60).toString().padStart(2, '0')
  const secondsLabel = (remaining % 60).toString().padStart(2, '0')

  return (
    <div className="glass flex items-center gap-3 rounded-[24px] p-5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-[var(--ink-soft)]">
          {technique.name} · {activeMode.label}
        </p>
        <p className="text-2xl font-extrabold text-[var(--ink)]">
          {minutesLabel}:{secondsLabel}
        </p>
      </div>
      <PipToggleButton />
      <button
        onClick={toggleRunning}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--lav-400)] to-[var(--lav-600)] text-white shadow-md transition hover:scale-105"
      >
        {running ? <IconPause className="h-5 w-5" /> : <IconPlay className="h-5 w-5" />}
      </button>
    </div>
  )
}