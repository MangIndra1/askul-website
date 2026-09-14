'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createTask, toggleTaskCompleted, updateTaskTitle, deleteTask } from '@/app/actions/tasks'
import { categoryColor, type TaskCategory } from '@/lib/taskCategories'
import { occursOn, DAY_OF_WEEK_LABELS, type RecurrenceFreq } from '@/lib/recurrence'

type Task = {
  id: string
  title: string
  category: string | null
  due_date: string | null
  completed: boolean
  recurrence_freq: string | null
  recurrence_interval: number
  recurrence_days_of_week: number[] | null
  recurrence_until: string | null
}

type Tab = 'all' | 'today' | 'upcoming' | 'completed'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
]

function formatDueDate(dueDate: string | null) {
  if (!dueDate) return null
  const date = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  if (dateOnly.getTime() === today.getTime()) return 'Today'
  if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function filterTasks(tasks: Task[], tab: Tab) {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  if (tab === 'today') {
    const direct = tasks.filter(
      (t) =>
        !t.completed &&
        !t.recurrence_freq &&
        t.due_date &&
        new Date(t.due_date) >= todayStart &&
        new Date(t.due_date) <= todayEnd
    )
    const recurring = tasks.filter(
      (t) =>
        !t.completed &&
        t.recurrence_freq &&
        t.due_date &&
        occursOn(
          t.due_date,
          {
            freq: t.recurrence_freq as RecurrenceFreq,
            interval: t.recurrence_interval,
            daysOfWeek: t.recurrence_days_of_week,
            until: t.recurrence_until,
          },
          todayStart
        )
    )
    return [...direct, ...recurring]
  }
  if (tab === 'upcoming') {
    return tasks.filter((t) => !t.completed && t.due_date && new Date(t.due_date) > todayEnd)
  }
  if (tab === 'completed') {
    return tasks.filter((t) => t.completed)
  }
  return tasks
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
function IconTrash({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
    </svg>
  )
}

export function TasksCard({ tasks, categories }: { tasks: Task[]; categories: TaskCategory[] }) {
  const [tab, setTab] = useState<Tab>('all')
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [mode, setMode] = useState<'once' | 'multiday' | 'recurring'>('once')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [multiDayEnd, setMultiDayEnd] = useState('')
  const [recFreq, setRecFreq] = useState<RecurrenceFreq>('daily')
  const [recInterval, setRecInterval] = useState(1)
  const [recDays, setRecDays] = useState<number[]>([])
  const [recUntil, setRecUntil] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const sorted = filterTasks(tasks, tab)
    .slice()
    .sort((a, b) => {
      const at = a.due_date ? new Date(a.due_date).getTime() : 0
      const bt = b.due_date ? new Date(b.due_date).getTime() : 0
      return bt - at // terbaru (tanggal paling jauh ke depan) duluan
    })
  const filtered = sorted.slice(0, 7)
  const hasMore = sorted.length > 7

  function resetForm() {
    setTitle('')
    setCategory('')
    setMode('once')
    setDueDate('')
    setDueTime('')
    setEndTime('')
    setMultiDayEnd('')
    setRecFreq('daily')
    setRecInterval(1)
    setRecDays([])
    setRecUntil('')
    setAdding(false)
  }

  function toggleRecDay(day: number) {
    setRecDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)))
  }

  async function handleAdd() {
    if (!title.trim()) return
    setSubmitting(true)

    let combinedDueDate: string | null = null
    let combinedEndDate: string | null = null
    let recurrence: { freq: RecurrenceFreq | null; interval: number; daysOfWeek: number[] | null; until: string | null } | undefined

    if (mode === 'recurring') {
      combinedDueDate = dueDate ? `${dueDate}T${dueTime || '00:00'}:00+08:00` : null
      recurrence = {
        freq: recFreq,
        interval: recInterval,
        daysOfWeek: recFreq === 'weekly' ? recDays : null,
        until: recUntil || null,
      }
    } else if (mode === 'multiday') {
      // Acara multi-hari: nggak perlu jam spesifik, dianggap "sepanjang
      // hari" dari tanggal awal sampai tanggal akhir. Tempelin offset
      // WITA eksplisit (+08:00) — TANPA ini, Supabase nganggep string-nya
      // UTC, bikin tanggal geser pas ditampilin balik di browser (WITA).
      combinedDueDate = dueDate ? `${dueDate}T00:00:00+08:00` : null
      combinedEndDate = multiDayEnd ? `${multiDayEnd}T23:59:59+08:00` : null
    } else {
      combinedDueDate = dueDate ? `${dueDate}T${dueTime || '00:00'}:00+08:00` : null
      combinedEndDate = dueDate && dueTime && endTime ? `${dueDate}T${endTime}:00+08:00` : null
    }

    await createTask({
      title: title.trim(),
      category: category || null,
      dueDate: combinedDueDate,
      endDate: combinedEndDate,
      recurrence,
    })
    resetForm()
    setSubmitting(false)
  }

  async function handleToggle(task: Task) {
    setPendingIds((prev) => new Set(prev).add(task.id))
    await toggleTaskCompleted(task.id, !task.completed)
    setPendingIds((prev) => {
      const next = new Set(prev)
      next.delete(task.id)
      return next
    })
  }

  function startEditing(task: Task) {
    setEditingId(task.id)
    setEditingTitle(task.title)
  }

  async function saveEdit(id: string) {
    if (!editingTitle.trim()) return
    await updateTaskTitle(id, editingTitle.trim())
    setEditingId(null)
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Hapus task "${task.title}"?`)) return
    await deleteTask(task.id)
  }

  return (
    <div className="glass rounded-[28px] p-6">
      <div className="flex items-center justify-between">
        <p className="text-[18px] font-bold tracking-[-0.3px] text-[var(--dk-text)]">My Tasks</p>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-[var(--lav-600)] px-4 py-2 text-xs font-semibold text-white"
        >
          <IconPlus className="h-3.5 w-3.5" />
          Add Task
        </button>
      </div>

      <div className="mt-4 flex shrink-0 gap-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? 'rounded-full bg-[var(--lav-600)] px-3.5 py-1.5 text-sm font-medium text-white'
                : 'px-1 text-sm font-medium text-[var(--dk-text-soft)] transition hover:text-[var(--dk-text)]'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {adding && (
        <div className="mt-4 flex shrink-0 flex-col gap-2 rounded-2xl bg-white/[0.04] p-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Judul tugas..."
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none placeholder:text-[var(--dk-text-faint)] focus:border-[var(--lav-400)]"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
          >
            <option value="" className="bg-[#171c37]">Tanpa kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name} className="bg-[#171c37]">
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            {(['once', 'multiday', 'recurring'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  mode === m ? 'bg-[var(--lav-600)] text-white' : 'bg-white/[0.06] text-[var(--dk-text-soft)]'
                }`}
              >
                {m === 'once' ? 'Sekali' : m === 'multiday' ? 'Multi-hari' : 'Berulang'}
              </button>
            ))}
          </div>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
          />

          {mode === 'once' && (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                disabled={!dueDate}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)] disabled:opacity-40"
              />
              <span className="text-xs text-[var(--dk-text-faint)]">s/d</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!dueDate || !dueTime}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)] disabled:opacity-40"
              />
            </div>
          )}

          {mode === 'multiday' && (
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs text-[var(--dk-text-faint)]">s/d tanggal</span>
              <input
                type="date"
                value={multiDayEnd}
                onChange={(e) => setMultiDayEnd(e.target.value)}
                min={dueDate}
                disabled={!dueDate}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)] disabled:opacity-40"
              />
            </div>
          )}

          {mode === 'recurring' && (
            <div className="flex flex-col gap-2 rounded-xl bg-white/[0.03] p-3">
              <div className="flex items-center gap-2">
                <select
                  value={recFreq}
                  onChange={(e) => setRecFreq(e.target.value as RecurrenceFreq)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
                >
                  <option value="daily" className="bg-[#171c37]">Harian</option>
                  <option value="weekly" className="bg-[#171c37]">Mingguan</option>
                  <option value="monthly" className="bg-[#171c37]">Bulanan</option>
                  <option value="yearly" className="bg-[#171c37]">Tahunan</option>
                </select>
                <span className="shrink-0 text-xs text-[var(--dk-text-faint)]">tiap</span>
                <input
                  type="number"
                  min={1}
                  value={recInterval}
                  onChange={(e) => setRecInterval(Math.max(1, Number(e.target.value) || 1))}
                  className="w-16 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
                />
              </div>

              {recFreq === 'weekly' && (
                <div className="flex gap-1.5">
                  {DAY_OF_WEEK_LABELS.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => toggleRecDay(i)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold transition ${
                        recDays.includes(i) ? 'bg-[var(--lav-600)] text-white' : 'bg-white/[0.06] text-[var(--dk-text-soft)]'
                      }`}
                    >
                      {label.charAt(0)}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="shrink-0 text-xs text-[var(--dk-text-faint)]">Berakhir (opsional)</span>
                <input
                  type="date"
                  value={recUntil}
                  onChange={(e) => setRecUntil(e.target.value)}
                  min={dueDate}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={submitting || !title.trim()}
            className="rounded-xl bg-[var(--lav-600)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Simpan
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-col">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--dk-text-faint)]">Nggak ada tugas di sini.</p>
        ) : (
          filtered.map((task) => {
            const dueLabel = formatDueDate(task.due_date)
            const pending = pendingIds.has(task.id)
            const isEditing = editingId === task.id
            return (
              <div key={task.id} className="group flex items-center gap-3 border-b border-white/[0.05] py-3 last:border-none">
                <button
                  onClick={() => handleToggle(task)}
                  disabled={pending || Boolean(task.recurrence_freq)}
                  title={task.recurrence_freq ? 'Task berulang belum bisa dicentang per-hari' : undefined}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    task.completed ? 'border-transparent bg-[var(--lav-600)]' : 'border-[var(--dk-text-faint)]'
                  } ${pending || task.recurrence_freq ? 'opacity-50' : ''}`}
                >
                  {task.completed && (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>

                {isEditing ? (
                  <input
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(task.id)}
                    onBlur={() => saveEdit(task.id)}
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
                  />
                ) : (
                  <span
                    onClick={() => startEditing(task)}
                    className={`min-w-0 flex-1 cursor-text text-sm ${task.completed ? 'text-[var(--dk-text-soft)]' : 'text-[var(--dk-text)]'}`}
                  >
                    {task.recurrence_freq && '↻ '}
                    {task.title}
                  </span>
                )}

                {task.category && (
                  <span
                    className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium"
                    style={{ color: categoryColor(categories, task.category) }}
                  >
                    {task.category}
                  </span>
                )}

                {dueLabel && <span className="shrink-0 text-xs text-[var(--dk-text-faint)]">{dueLabel}</span>}

                <button
                  onClick={() => handleDelete(task)}
                  className="shrink-0 text-[var(--dk-text-faint)] opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            )
          })
        )}
      </div>

      {hasMore && (
        <Link
          href="/tasks"
          className="mt-3 flex items-center justify-center gap-1 rounded-xl bg-white/[0.04] py-2 text-xs font-semibold text-[var(--dk-text-soft)] transition hover:bg-white/[0.08] hover:text-[var(--dk-text)]"
        >
          Lihat Semua ({sorted.length})
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      )}
    </div>
  )
}