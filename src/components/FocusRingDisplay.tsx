'use client'

import { useFocusTimer } from '@/context/FocusTimerContext'

// Ring dengan celah di bawah (gauge-style, bukan lingkaran penuh).
// Konvensi sudut: 0deg = jam 12 (atas), bertambah searah jarum jam.
// Container ring sengaja disamakan lebar-nya sama VIEWBOX_SIZE (360=360)
// biar skalanya 1:1 — radius 160 di viewBox = radius 160px di ukuran penuh.
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

// Dipakai di kartu dashboard (FocusTimer.tsx) DAN di jendela PiP
// (FocusTimerContext.tsx) — satu sumber kebenaran, dijamin identik.
export function FocusRingDisplay({ maxWidth = 360 }: { maxWidth?: number }) {
  const { remaining, running, totalSeconds, activeMode, toggleRunning, resetTimer } = useFocusTimer()

  const minutesLabel = Math.floor(remaining / 60).toString().padStart(2, '0')
  const secondsLabel = (remaining % 60).toString().padStart(2, '0')
  const progressPct = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0

  return (
    <div className="relative mx-auto aspect-square w-full" style={{ maxWidth }}>
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

      <button
        onClick={toggleRunning}
        aria-label={running ? 'Pause timer' : 'Start timer'}
        className="absolute left-1/2 z-20 flex h-[60px] w-[60px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--lav-600)] text-white transition-all duration-200 hover:scale-105 active:scale-95"
        style={{ top: `${GAP_TOP_PERCENT}%`, boxShadow: '0 0 24px rgba(139,77,235,0.48)' }}
      >
        {running ? <IconPause className="h-5 w-5" /> : <IconPlay className="h-5 w-5" />}
      </button>

      <button
        onClick={resetTimer}
        aria-label="Reset timer"
        className="absolute bottom-0 right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[var(--dk-text-soft)] opacity-70 transition hover:scale-105 hover:opacity-100"
      >
        <IconReset className="h-[19px] w-[19px]" />
      </button>
    </div>
  )
}