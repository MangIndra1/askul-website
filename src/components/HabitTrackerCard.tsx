'use client'

import { Fragment, useState } from 'react'
import {
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitLog,
} from '@/app/actions/habits'

type Habit = { id: string; name: string }
type HabitLog = { habit_id: string; log_date: string }

const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

const HABIT_COLORS = [
  'var(--lav-400)',
  'var(--status-orange)',
  'var(--status-green)',
  'var(--status-blue)',
  'var(--pink-400)',
]

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

function getWeekDates(offset: number) {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day

  const monday = new Date(now)
  monday.setDate(now.getDate() + diff + offset * 7)
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
    </svg>
  )
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
    </svg>
  )
}

export function HabitTrackerCard({
  habits,
  logs,
}: {
  habits: Habit[]
  logs: HabitLog[]
}) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const weekDates = getWeekDates(weekOffset)
  const logSet = new Set(
    logs.map((l) => `${l.habit_id}_${l.log_date}`)
  )

  async function handleAddHabit() {
    if (!name.trim()) return

    setSubmitting(true)

    await createHabit(name.trim())

    setName('')
    setAdding(false)
    setSubmitting(false)
  }

  function startEditing(habit: Habit) {
    setEditingId(habit.id)
    setEditingName(habit.name)
  }

  async function saveEdit(id: string) {
    if (!editingName.trim()) return

    await updateHabit(id, editingName.trim())
    setEditingId(null)
  }

  async function handleDelete(habit: Habit) {
    if (
      !window.confirm(
        `Hapus habit "${habit.name}"? Semua riwayat centangnya ikut kehapus.`
      )
    ) {
      return
    }

    await deleteHabit(habit.id)
  }

  async function handleToggle(habitId: string, date: Date) {
    const key = toDateKey(date)
    const cellKey = `${habitId}_${key}`
    const checked = logSet.has(cellKey)

    setPending((prev) => new Set(prev).add(cellKey))

    await toggleHabitLog(habitId, key, !checked)

    setPending((prev) => {
      const next = new Set(prev)
      next.delete(cellKey)
      return next
    })
  }

  const weekLabel =
    weekOffset === 0
      ? 'Minggu ini'
      : weekOffset === -1
        ? 'Minggu lalu'
        : weekOffset === 1
          ? 'Minggu depan'
          : `${weekDates[0].getDate()} ${weekDates[0].toLocaleDateString(
              'id-ID',
              { month: 'short' }
            )}`

  return (
    <div className="glass h-fit rounded-[28px] p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[18px] font-bold tracking-[-0.3px] text-[var(--dk-text)]">
          Habit Tracker
        </p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--dk-text-soft)] transition hover:bg-white/[0.06]"
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>

          <span className="min-w-[90px] text-center text-xs font-medium text-[var(--dk-text-soft)]">
            {weekLabel}
          </span>

          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--dk-text-soft)] transition hover:bg-white/[0.06]"
          >
            <IconChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Habit Grid */}
      <div className="mt-5 overflow-x-auto">
        <div
          className="grid w-full gap-y-4"
          style={{
            gridTemplateColumns: '190px repeat(7, minmax(40px, 1fr))',
          }}
        >
          {/* Day Labels */}
          <span />

          {DAY_LABELS.map((d) => (
            <span
              key={d}
              className="text-center text-[11px] font-medium text-[var(--dk-text-faint)]"
            >
              {d}
            </span>
          ))}

          {/* Habits */}
          {habits.map((habit, hi) => {
            const color = HABIT_COLORS[hi % HABIT_COLORS.length]
            const isEditing = editingId === habit.id

            return (
              <Fragment key={habit.id}>
                {/* Habit Name */}
                <div className="group flex items-center gap-2 pr-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {habit.name.charAt(0).toUpperCase()}
                  </span>

                  {isEditing ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && saveEdit(habit.id)
                      }
                      onBlur={() => saveEdit(habit.id)}
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
                    />
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-sm text-[var(--dk-text)]">
                        {habit.name}
                      </span>

                      <button
                        onClick={() => startEditing(habit)}
                        className="shrink-0 text-[var(--dk-text-faint)] opacity-0 transition hover:text-[var(--dk-text)] group-hover:opacity-100"
                      >
                        <IconPencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(habit)}
                        className="shrink-0 text-[var(--dk-text-faint)] opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Weekly Checkboxes */}
                {weekDates.map((date) => {
                  const key = toDateKey(date)
                  const cellKey = `${habit.id}_${key}`
                  const checked = logSet.has(cellKey)
                  const isPending = pending.has(cellKey)

                  return (
                    <div
                      key={cellKey}
                      className="flex items-center justify-center"
                    >
                      <button
                        onClick={() => handleToggle(habit.id, date)}
                        disabled={isPending}
                        className="flex h-7 w-7 items-center justify-center rounded-full border-2 transition disabled:opacity-50"
                        style={
                          checked
                            ? {
                                backgroundColor: color,
                                borderColor: 'transparent',
                              }
                            : {
                                borderColor: 'var(--dk-text-faint)',
                              }
                        }
                      >
                        {checked && (
                          <IconCheck className="h-3.5 w-3.5 text-white" />
                        )}
                      </button>
                    </div>
                  )
                })}
              </Fragment>
            )
          })}
        </div>
      </div>

      {/* Empty State */}
      {habits.length === 0 && !adding && (
        <p className="mt-4 text-center text-sm text-[var(--dk-text-faint)]">
          Belum ada habit. Tambah satu dulu.
        </p>
      )}

      {/* Add Habit */}
      {adding ? (
        <div className="mt-4 flex gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' && handleAddHabit()
            }
            placeholder="Nama habit (misal: Baca buku)"
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none placeholder:text-[var(--dk-text-faint)] focus:border-[var(--lav-400)]"
          />

          <button
            onClick={handleAddHabit}
            disabled={submitting || !name.trim()}
            className="rounded-xl bg-[var(--lav-600)] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            Simpan
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--dk-text-soft)] transition hover:text-[var(--dk-text)]"
        >
          <IconPlus className="h-3.5 w-3.5" />
          Tambah habit
        </button>
      )}
    </div>
  )
}