'use client'

import { useState } from 'react'
import { createTask, toggleTaskCompleted } from '@/app/actions/tasks'
import { TASK_CATEGORIES, categoryColor } from '@/lib/taskCategories'

type Task = {
  id: string
  title: string
  category: string | null
  due_date: string | null
  completed: boolean
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
    return tasks.filter(
      (t) => !t.completed && t.due_date && new Date(t.due_date) >= todayStart && new Date(t.due_date) <= todayEnd
    )
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

function IconStar({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l2.4 5.4L20 9.3l-4 3.9.9 5.8L12 16.3l-4.9 2.7.9-5.8-4-3.9 5.6-.9L12 3Z" />
    </svg>
  )
}

export function TasksCard({ tasks }: { tasks: Task[] }) {
  const [tab, setTab] = useState<Tab>('all')
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const filtered = filterTasks(tasks, tab)

  async function handleAdd() {
    if (!title.trim()) return
    setSubmitting(true)
    const combinedDueDate = dueDate ? `${dueDate}T${dueTime || '00:00'}:00` : null
    const combinedEndDate = dueDate && endTime ? `${dueDate}T${endTime}:00` : null
    await createTask({
      title: title.trim(),
      category: category || null,
      dueDate: combinedDueDate,
      endDate: combinedEndDate,
    })
    setTitle('')
    setCategory('')
    setDueDate('')
    setDueTime('')
    setEndTime('')
    setAdding(false)
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

      <div className="mt-4 flex gap-4">
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
        <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-white/[0.04] p-3">
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
            {TASK_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-[#171c37]">
                {c.value}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
            />
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              disabled={!dueDate}
              className="w-24 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)] disabled:opacity-40"
            />
            <span className="flex items-center text-xs text-[var(--dk-text-faint)]">s/d</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={!dueDate || !dueTime}
              className="w-24 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)] disabled:opacity-40"
            />
          </div>
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
            return (
              <div key={task.id} className="flex items-center gap-3 border-b border-white/[0.05] py-3 last:border-none">
                <button
                  onClick={() => handleToggle(task)}
                  disabled={pending}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    task.completed ? 'border-transparent bg-[var(--lav-600)]' : 'border-[var(--dk-text-faint)]'
                  } ${pending ? 'opacity-50' : ''}`}
                >
                  {task.completed && (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>

                <span className={`flex-1 text-sm ${task.completed ? 'text-[var(--dk-text-soft)]' : 'text-[var(--dk-text)]'}`}>
                  {task.title}
                </span>

                {task.category && (
                  <span
                    className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium"
                    style={{ color: categoryColor(task.category) }}
                  >
                    {task.category}
                  </span>
                )}

                {dueLabel && <span className="shrink-0 text-xs text-[var(--dk-text-faint)]">{dueLabel}</span>}

                <IconStar
                  className={`h-4 w-4 shrink-0 ${task.completed ? 'text-[var(--lav-400)]' : 'text-[var(--dk-text-faint)]'}`}
                  filled={task.completed}
                />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}