'use client'

import { useState } from 'react'

type Task = { id: string; due_date: string | null }

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}
function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function CalendarCard({ tasks }: { tasks: Task[] }) {
  const [viewDate, setViewDate] = useState(() => new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const startWeekday = (firstDay.getDay() + 6) % 7 // Sen=0 ... Min=6
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const taskDaySet = new Set(
    tasks
      .filter((t) => t.due_date)
      .map((t) => new Date(t.due_date as string))
      .filter((d) => d.getFullYear() === year && d.getMonth() === month)
      .map((d) => d.getDate())
  )

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1))
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1))
  }

  return (
    <div className="glass rounded-[28px] p-6">
      <p className="text-[18px] font-bold tracking-[-0.3px] text-[var(--dk-text)]">Calendar</p>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--dk-text-soft)] transition hover:bg-white/[0.06]"
        >
          <IconChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-[var(--dk-text)]">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--dk-text-soft)] transition hover:bg-white/[0.06]"
        >
          <IconChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-2 text-center">
        {DAY_LABELS.map((d) => (
          <span key={d} className="text-[10px] font-medium text-[var(--dk-text-faint)]">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={i} />
          const isToday = isCurrentMonth && day === today.getDate()
          const hasTask = taskDaySet.has(day)
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                  isToday ? 'bg-[var(--lav-600)] font-semibold text-white' : 'text-[var(--dk-text-soft)]'
                }`}
              >
                {day}
              </span>
              <span className={`h-1 w-1 rounded-full ${hasTask ? 'bg-[var(--lav-400)]' : 'bg-transparent'}`} />
            </div>
          )
        })}
      </div>
    </div>
  )
}