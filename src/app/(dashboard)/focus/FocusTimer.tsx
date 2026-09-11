'use client'

import { useState } from 'react'
import { useFocusTimer, BUILT_IN_TECHNIQUES, type Technique } from '@/context/FocusTimerContext'
import { PipToggleButton } from '@/components/PipToggleButton'

const VIEWBOX_SIZE = 360
const RING_CX = 180
const RING_CY = 180
const RING_R = 160
const GAP_DEGREES = 48
const RING_START_ANGLE = 180 + GAP_DEGREES / 2 // ujung kanan celah
const RING_SPAN = 360 - GAP_DEGREES
const RING_END_ANGLE = RING_START_ANGLE + RING_SPAN // ujung kiri celah

function polarPoint(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: RING_CX + RING_R * Math.sin(rad),
    y: RING_CY - RING_R * Math.cos(rad),
  }
}

function describeArc(startAngle: number, endAngle: number) {
  const start = polarPoint(startAngle)
  const end = polarPoint(endAngle)
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${RING_R} ${RING_R} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`
}

// Posisi vertikal celah diturunkan dari geometri ring di atas (bukan angka
// hardcode) — kalau RING_R/GAP_DEGREES berubah, ini otomatis ikut benar.
const GAP_TOP_PERCENT = (polarPoint(RING_START_ANGLE).y / VIEWBOX_SIZE) * 100

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
function IconZap({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
    </svg>
  )
}
function IconCoffee({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h13v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z" /><path d="M16 9h2a2 2 0 0 1 0 4h-2" /><path d="M6 2v2M9 2v2M12 2v2" />
    </svg>
  )
}
function IconMoon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  )
}
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
function IconReset({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  )
}

const MODE_ICON = {
  focus: IconZap,
  short_break: IconCoffee,
  long_break: IconMoon,
} as const

export function FocusTimer() {
  const {
    technique, customMinutes, activeModeId, remaining, running, sessionsToday,
    pomodoroCount, activeMode, totalSeconds, setTechnique, setCustomMinutes, toggleRunning, resetTimer,
  } = useFocusTimer()
  const [menuOpen, setMenuOpen] = useState(false)

  function selectTechnique(t: Technique | 'custom') {
    setTechnique(t)
    setMenuOpen(false)
  }

  const minutesLabel = Math.floor(remaining / 60).toString().padStart(2, '0')
  const secondsLabel = (remaining % 60).toString().padStart(2, '0')
  const progressPct = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0
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

      {/* Container ring: aspect-square + max-w biar responsive, skala 1:1 sama VIEWBOX_SIZE */}
      <div className="relative mx-auto mt-3 mb-8 aspect-square w-full max-w-[360px]">
        <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id="focusRing" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--lav-400)" />
              <stop offset="100%" stopColor="var(--pink-400)" />
            </linearGradient>
            <filter id="focusRingGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d={describeArc(RING_START_ANGLE, RING_END_ANGLE)}
            fill="none"
            stroke="rgba(105,72,180,0.18)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d={describeArc(RING_START_ANGLE, RING_START_ANGLE + (progressPct / 100) * RING_SPAN)}
            fill="none"
            stroke="url(#focusRing)"
            strokeWidth="10"
            strokeLinecap="round"
            filter="url(#focusRingGlow)"
          />
        </svg>

        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <span className="whitespace-nowrap text-[46px] font-medium leading-none tracking-[-1.8px] text-[var(--dk-text)]">
            {minutesLabel}:{secondsLabel}
          </span>
          <span className="mt-2 text-[15px] font-medium text-[var(--dk-text-soft)]">{activeMode?.label}</span>
        </div>

        {/* Play/pause: top dihitung dari GAP_TOP_PERCENT (geometri ring), bukan angka manual */}
        <button
          onClick={toggleRunning}
          aria-label={running ? 'Pause timer' : 'Start timer'}
          className="absolute left-1/2 z-20 flex h-[60px] w-[60px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--lav-600)] text-white transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ top: `${GAP_TOP_PERCENT}%`, boxShadow: '0 0 24px rgba(139,77,235,0.48)' }}
        >
          {running ? <IconPause className="h-5 w-5" /> : <IconPlay className="h-5 w-5" />}
        </button>

        {/* Reset: nempel pojok kanan-bawah CONTAINER (bukan offset px dari tengah),
            jadi ikut scale kalau container mengecil di layar sempit */}
        <button
          onClick={resetTimer}
          aria-label="Reset timer"
          className="absolute bottom-0 right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[var(--dk-text-soft)] opacity-70 transition hover:scale-105 hover:opacity-100"
        >
          <IconReset className="h-[19px] w-[19px]" />
        </button>
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
        <div className="mb-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-[var(--dk-text-soft)]">
            {(() => {
              const Icon = MODE_ICON[activeModeId]
              return <Icon className="h-3.5 w-3.5" />
            })()}
            <span>{activeMode.label} · berjalan otomatis</span>
          </div>

          {hasLongBreak && (
            <div className="flex items-center gap-1.5" aria-label={`Pomodoro ke-${pomodoroCount + 1} dari 4`}>
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition ${
                    i < pomodoroCount ? 'bg-[var(--lav-400)]' : 'bg-white/[0.12]'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-1 flex items-center justify-center gap-2 border-t border-white/[0.08] pt-3 text-[var(--lav-400)]">
        <IconCheck className="h-4 w-4" />
        <span className="text-base font-bold">{sessionsToday}</span>
        <span className="text-xs text-[var(--dk-text-soft)]">sesi selesai hari ini</span>
      </div>
    </div>
  )
}