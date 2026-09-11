'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { saveFocusSession } from '@/app/(dashboard)/focus/actions'
import { FocusRingDisplay } from '@/components/FocusRingDisplay'

export type ModeId = 'focus' | 'short_break' | 'long_break'
export type TechniqueId = 'pomodoro' | '52-17' | 'ultradian' | 'custom'
export type Mode = { id: ModeId; label: string; minutes: number }
export type Technique = { id: TechniqueId; name: string; description: string; modes: Mode[] }

export const BUILT_IN_TECHNIQUES: Technique[] = [
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    description: '25 menit fokus / 5 menit istirahat',
    modes: [
      { id: 'focus', label: 'Fokus', minutes: 25 },
      { id: 'short_break', label: 'Istirahat pendek', minutes: 5 },
      { id: 'long_break', label: 'Istirahat panjang', minutes: 15 },
    ],
  },
  {
    id: '52-17',
    name: '52/17 Rule',
    description: '52 menit fokus / 17 menit istirahat',
    modes: [
      { id: 'focus', label: 'Fokus', minutes: 52 },
      { id: 'short_break', label: 'Istirahat', minutes: 17 },
    ],
  },
  {
    id: 'ultradian',
    name: 'Ultradian Rhythm',
    description: '90 menit fokus / 20 menit istirahat',
    modes: [
      { id: 'focus', label: 'Fokus', minutes: 90 },
      { id: 'short_break', label: 'Istirahat', minutes: 20 },
    ],
  },
]

// Pomodoro asli: istirahat panjang muncul otomatis setiap 4 sesi fokus,
// bukan pilihan manual. Teknik lain (52/17, Ultradian, Custom) cuma
// bolak-balik fokus-istirahat tanpa siklus 4x ini.
const POMODOROS_BEFORE_LONG_BREAK = 4

type FocusTimerState = {
  technique: Technique
  customMinutes: { focus: number; short_break: number }
  activeModeId: ModeId
  remaining: number
  running: boolean
  sessionsToday: number
  pomodoroCount: number
  modes: Mode[]
  activeMode: Mode
  totalSeconds: number
  setTechnique: (t: Technique | 'custom') => void
  setCustomMinutes: (m: { focus: number; short_break: number }) => void
  toggleRunning: () => void
  resetTimer: () => void
  isPipSupported: boolean
  isPipActive: boolean
  openPip: () => void
  closePip: () => void
}

const FocusTimerCtx = createContext<FocusTimerState | null>(null)

function copyStyleSheetsInto(pipWin: Window) {
  ;[...document.styleSheets].forEach((styleSheet) => {
    try {
      const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('')
      const style = document.createElement('style')
      style.textContent = cssRules
      pipWin.document.head.appendChild(style)
    } catch {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.type = styleSheet.type
      if (styleSheet.media) link.media = styleSheet.media.toString()
      if (styleSheet.href) link.href = styleSheet.href
      pipWin.document.head.appendChild(link)
    }
  })
}

export function FocusTimerProvider({
  initialSessionsToday,
  children,
}: {
  initialSessionsToday: number
  children: ReactNode
}) {
  const [technique, setTechniqueState] = useState<Technique>(BUILT_IN_TECHNIQUES[0])
  const [customMinutes, setCustomMinutes] = useState({ focus: 30, short_break: 10 })
  const [activeModeId, setActiveModeId] = useState<ModeId>('focus')
  const [running, setRunning] = useState(false)
  const [sessionsToday, setSessionsToday] = useState(initialSessionsToday)
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const startedAtRef = useRef<string | null>(null)

  // Target waktu SELESAI (timestamp asli, ms since epoch) — bukan cuma
  // ngitung "tick", biar akurat walau setInterval di-throttle browser
  // pas tab di-background (lihat penjelasan di bawah).
  const endTimeRef = useRef<number | null>(null)

  const [pipWindow, setPipWindow] = useState<Window | null>(null)
  const [isPipSupported, setIsPipSupported] = useState(false)

  useEffect(() => {
    setIsPipSupported(typeof window !== 'undefined' && 'documentPictureInPicture' in window)
  }, [])

  const modes: Mode[] =
    technique.id === 'custom'
      ? [
          { id: 'focus', label: 'Fokus', minutes: customMinutes.focus },
          { id: 'short_break', label: 'Istirahat', minutes: customMinutes.short_break },
        ]
      : technique.modes

  const activeMode = modes.find((m) => m.id === activeModeId) ?? modes[0]
  const totalSeconds = activeMode.minutes * 60
  const [remaining, setRemaining] = useState(totalSeconds)

  function computeRemainingFromEndTime() {
    if (!endTimeRef.current) return 0
    return Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000))
  }

  useEffect(() => {
    setRunning(false)
    setActiveModeId('focus')
    setPomodoroCount(0)
    startedAtRef.current = null
    endTimeRef.current = null
  }, [technique, customMinutes])

  useEffect(() => {
    setRemaining(totalSeconds)
  }, [activeModeId, totalSeconds])

  useEffect(() => {
    if (!running) return
    const tick = () => setRemaining(computeRemainingFromEndTime())
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [running])

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible' && running) {
        setRemaining(computeRemainingFromEndTime())
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [running])

  useEffect(() => {
    if (running && remaining === 0) {
      handleComplete()
    }
  }, [remaining, running])

  async function handleComplete() {
    if (activeModeId === 'focus' && startedAtRef.current) {
      setSessionsToday((n) => n + 1)
      await saveFocusSession({
        startedAt: startedAtRef.current,
        durationMinutes: activeMode.minutes,
        techniqueName: technique.name,
      })
    }
    startedAtRef.current = null

    const hasLongBreak = technique.modes.some((m) => m.id === 'long_break')
    let nextModeId: ModeId

    if (activeModeId === 'focus') {
      if (hasLongBreak) {
        const newCount = pomodoroCount + 1
        if (newCount >= POMODOROS_BEFORE_LONG_BREAK) {
          nextModeId = 'long_break'
          setPomodoroCount(0)
        } else {
          nextModeId = 'short_break'
          setPomodoroCount(newCount)
        }
      } else {
        nextModeId = 'short_break'
      }
    } else {
      nextModeId = 'focus'
      startedAtRef.current = new Date().toISOString()
    }

    const nextMode = modes.find((m) => m.id === nextModeId) ?? modes[0]
    endTimeRef.current = Date.now() + nextMode.minutes * 60 * 1000

    setActiveModeId(nextModeId)
  }

  function toggleRunning() {
    if (!running) {
      if (remaining === totalSeconds && activeModeId === 'focus') {
        startedAtRef.current = new Date().toISOString()
      }
      endTimeRef.current = Date.now() + remaining * 1000
    }
    setRunning((r) => !r)
  }

  function resetTimer() {
    setRunning(false)
    setPomodoroCount(0)
    startedAtRef.current = null
    endTimeRef.current = null

    const focusMode = modes.find((m) => m.id === 'focus') ?? modes[0]
    setRemaining(focusMode.minutes * 60)
    setActiveModeId('focus')
  }

  function setTechnique(t: Technique | 'custom') {
    if (t === 'custom') {
      setTechniqueState({ id: 'custom', name: 'Custom', description: 'Atur durasi sendiri', modes: [] })
    } else {
      setTechniqueState(t)
    }
  }

  async function openPip() {
    if (!window.documentPictureInPicture) return
    const pipWin = await window.documentPictureInPicture.requestWindow({ width: 240, height: 300 })
    copyStyleSheetsInto(pipWin)
    pipWin.addEventListener('pagehide', () => setPipWindow(null), { once: true })
    setPipWindow(pipWin)
  }

  function closePip() {
    pipWindow?.close()
    setPipWindow(null)
  }

  return (
    <FocusTimerCtx.Provider
      value={{
        technique,
        customMinutes,
        activeModeId,
        remaining,
        running,
        sessionsToday,
        pomodoroCount,
        modes,
        activeMode,
        totalSeconds,
        setTechnique,
        setCustomMinutes,
        toggleRunning,
        resetTimer,
        isPipSupported,
        isPipActive: pipWindow !== null,
        openPip,
        closePip,
      }}
    >
      {children}
      {pipWindow &&
        createPortal(
          <div
            style={{
              fontFamily: 'var(--font-plus-jakarta), ui-sans-serif, sans-serif',
              background: 'linear-gradient(160deg, var(--dk-bg-0, #02020e) 0%, var(--dk-bg-1, #090e1f) 100%)',
              minHeight: '100%',
              width: '100%',
              boxSizing: 'border-box',
              padding: '14px',
              margin: 0,
            }}
          >
            <p
              style={{
                textAlign: 'center',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--dk-text-soft, #9599c2)',
                margin: '0 0 4px',
              }}
            >
              {technique.name}
            </p>
            <FocusRingDisplay maxWidth={200} />
          </div>,
          pipWindow.document.body
        )}
    </FocusTimerCtx.Provider>
  )
}

export function useFocusTimer() {
  const ctx = useContext(FocusTimerCtx)
  if (!ctx) throw new Error('useFocusTimer harus dipakai di dalam FocusTimerProvider')
  return ctx
}