'use client'

import { useState } from 'react'
import { useFocusTimer, BUILT_IN_TECHNIQUES, type Technique } from '@/context/FocusTimerContext'
import { PipToggleButton } from '@/components/PipToggleButton'
import { FocusRingDisplay } from '@/components/FocusRingDisplay'

function IconClock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
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
function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function FocusTimer() {
  const {
    technique, customMinutes, sessionsToday,
    pomodoroCount, setTechnique, setCustomMinutes,
  } = useFocusTimer()
  const [menuOpen, setMenuOpen] = useState(false)

  function selectTechnique(t: Technique | 'custom') {
    setTechnique(t)
    setMenuOpen(false)
  }

  const hasLongBreak = technique.modes.some((m) => m.id === 'long_break')

  return (
    <div className="glass relative rounded-[28px] p-6 text-center">
      <div className="flex items-start justify-between text-left">
        <p className="text-[18px] font-bold tracking-[-0.3px] text-[var(--dk-text)]">Focus Timer</p>
        <PipToggleButton />
      </div>

      <div className="relative mt-4 inline-block">
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="mx-auto flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.06] px-4 py-2 text-sm font-semibold text-[var(--dk-text)] transition hover:bg-white/[0.09]"
        >
          <IconClock className="h-4 w-4" />
          <span>{technique.name}</span>
          <IconChevronDown className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div className="absolute left-1/2 top-11 z-30 w-60 -translate-x-1/2 rounded-[18px] border border-white/10 bg-[rgba(23,28,55,0.97)] p-2 text-left shadow-xl backdrop-blur-xl">
            {BUILT_IN_TECHNIQUES.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTechnique(t)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-white/[0.06]"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--dk-text)]">{t.name}</p>
                  <p className="text-xs text-[var(--dk-text-soft)]">{t.description}</p>
                </div>
                {technique.id === t.id && <IconCheck className="ml-auto h-4 w-4 text-[var(--lav-400)]" />}
              </button>
            ))}
            <button
              onClick={() => selectTechnique('custom')}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-white/[0.06]"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--dk-text)]">Custom</p>
                <p className="text-xs text-[var(--dk-text-soft)]">Atur durasi sendiri</p>
              </div>
              {technique.id === 'custom' && <IconCheck className="ml-auto h-4 w-4 text-[var(--lav-400)]" />}
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 mb-8">
        <FocusRingDisplay maxWidth={360} />
      </div>

      {technique.id === 'custom' ? (
        <div className="mb-4 mt-1 flex justify-center gap-3">
          <label className="flex flex-col items-center text-xs text-[var(--dk-text-soft)]">
            Fokus (menit)
            <input
              type="number"
              min={1}
              value={customMinutes.focus}
              onChange={(e) => setCustomMinutes({ ...customMinutes, focus: Number(e.target.value) || 1 })}
              className="mt-1 w-16 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-center text-sm text-[var(--dk-text)] outline-none"
            />
          </label>
          <label className="flex flex-col items-center text-xs text-[var(--dk-text-soft)]">
            Istirahat (menit)
            <input
              type="number"
              min={1}
              value={customMinutes.short_break}
              onChange={(e) => setCustomMinutes({ ...customMinutes, short_break: Number(e.target.value) || 1 })}
              className="mt-1 w-16 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-center text-sm text-[var(--dk-text)] outline-none"
            />
          </label>
        </div>
      ) : (
        hasLongBreak && (
          <div
            className="mb-4 flex items-center justify-center gap-1.5"
            aria-label={`Pomodoro ke-${pomodoroCount + 1} dari 4`}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  i < pomodoroCount ? 'bg-[var(--lav-400)]' : 'bg-white/[0.12]'
                }`}
              />
            ))}
          </div>
        )
      )}

      <div className="mt-1 flex items-center justify-center gap-2 border-t border-white/[0.08] pt-3 text-[var(--lav-400)]">
        <IconCheck className="h-4 w-4" />
        <span className="text-base font-bold">{sessionsToday}</span>
        <span className="text-xs text-[var(--dk-text-soft)]">sesi selesai hari ini</span>
      </div>
    </div>
  )
}