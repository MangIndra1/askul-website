'use client'

import { useState } from 'react'
import { createTaskCategory, updateTaskCategory, deleteTaskCategory } from '@/app/actions/taskCategories'
import { createTask, updateTask, deleteTask, toggleTaskCompleted } from '@/app/actions/tasks'
import { categoryColor, type TaskCategory } from '@/lib/taskCategories'
import { describeRecurrence, DAY_OF_WEEK_LABELS, type RecurrenceFreq } from '@/lib/recurrence'

type Task = {
  id: string
  title: string
  category: string | null
  due_date: string | null
  end_date: string | null
  completed: boolean
  recurrence_freq: string | null
  recurrence_interval: number
  recurrence_days_of_week: number[] | null
  recurrence_until: string | null
}

const CATEGORY_COLOR_OPTIONS = [
  'var(--lav-400)',
  'var(--pink-400)',
  'var(--status-blue)',
  'var(--status-orange)',
  'var(--status-green)',
]

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
function IconPencil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
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

export function TasksPageClient({ categories, tasks }: { categories: TaskCategory[]; tasks: Task[] }) {
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLOR_OPTIONS[0])
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatColor, setEditCatColor] = useState('')

  async function handleAddCategory() {
    if (!newCatName.trim()) return
    await createTaskCategory(newCatName.trim(), newCatColor)
    setNewCatName('')
    setAddingCategory(false)
  }

  function startEditCategory(cat: TaskCategory) {
    setEditingCatId(cat.id)
    setEditCatName(cat.name)
    setEditCatColor(cat.color)
  }

  async function saveEditCategory(id: string) {
    if (!editCatName.trim()) return
    await updateTaskCategory(id, editCatName.trim(), editCatColor)
    setEditingCatId(null)
  }

  async function handleDeleteCategory(cat: TaskCategory) {
    if (
      !window.confirm(
        `Hapus kategori "${cat.name}"? Task yang pakai kategori ini nggak ikut kehapus, cuma labelnya jadi nggak nyambung lagi.`
      )
    )
      return
    await deleteTaskCategory(cat.id)
  }

  const [formOpen, setFormOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
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

  function resetForm() {
    setEditingTaskId(null)
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
    setFormOpen(false)
  }

  function startEditTask(task: Task) {
    setEditingTaskId(task.id)
    setTitle(task.title)
    setCategory(task.category ?? '')

    if (task.recurrence_freq) {
      setMode('recurring')
      setRecFreq(task.recurrence_freq as RecurrenceFreq)
      setRecInterval(task.recurrence_interval)
      setRecDays(task.recurrence_days_of_week ?? [])
      setRecUntil(task.recurrence_until ?? '')
      setDueDate(task.due_date ? task.due_date.slice(0, 10) : '')
      setDueTime(task.due_date ? task.due_date.slice(11, 16) : '')
    } else if (task.due_date) {
      const startKey = task.due_date.slice(0, 10)
      const endKey = task.end_date ? task.end_date.slice(0, 10) : startKey
      setDueDate(startKey)
      if (endKey !== startKey) {
        setMode('multiday')
        setMultiDayEnd(endKey)
      } else {
        setMode('once')
        setDueTime(task.due_date.slice(11, 16))
        setEndTime(task.end_date ? task.end_date.slice(11, 16) : '')
      }
    }

    setFormOpen(true)
  }

  function toggleRecDay(day: number) {
    setRecDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)))
  }

  async function handleSubmit() {
    if (!title.trim()) return
    setSubmitting(true)

    let combinedDue: string | null = null
    let combinedEnd: string | null = null
    let recurrence:
      | { freq: RecurrenceFreq | null; interval: number; daysOfWeek: number[] | null; until: string | null }
      | undefined

    if (mode === 'recurring') {
      combinedDue = dueDate ? `${dueDate}T${dueTime || '00:00'}:00+08:00` : null
      recurrence = {
        freq: recFreq,
        interval: recInterval,
        daysOfWeek: recFreq === 'weekly' ? recDays : null,
        until: recUntil || null,
      }
    } else if (mode === 'multiday') {
      combinedDue = dueDate ? `${dueDate}T00:00:00+08:00` : null
      combinedEnd = multiDayEnd ? `${multiDayEnd}T23:59:59+08:00` : null
    } else {
      combinedDue = dueDate ? `${dueDate}T${dueTime || '00:00'}:00+08:00` : null
      combinedEnd = dueDate && dueTime && endTime ? `${dueDate}T${endTime}:00+08:00` : null
    }

    const payload = { title: title.trim(), category: category || null, dueDate: combinedDue, endDate: combinedEnd, recurrence }

    if (editingTaskId) {
      await updateTask({ id: editingTaskId, ...payload })
    } else {
      await createTask(payload)
    }

    resetForm()
    setSubmitting(false)
  }

  async function handleDeleteTask(task: Task) {
    if (!window.confirm(`Hapus task "${task.title}"?`)) return
    await deleteTask(task.id)
  }

  async function handleToggle(task: Task) {
    await toggleTaskCompleted(task.id, !task.completed)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="glass rounded-[28px] p-6">
        <p className="text-[18px] font-bold tracking-[-0.3px] text-[var(--dk-text)]">Kelola Kategori</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div key={cat.id} className="group flex items-center gap-2 rounded-full bg-white/[0.06] py-1.5 pl-3 pr-2.5">
              {editingCatId === cat.id ? (
                <>
                  <input
                    autoFocus
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEditCategory(cat.id)}
                    className="w-24 border-b border-white/20 bg-transparent text-sm text-[var(--dk-text)] outline-none"
                  />
                  <div className="flex gap-1">
                    {CATEGORY_COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditCatColor(c)}
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: c, boxShadow: editCatColor === c ? '0 0 0 2px white' : 'none' }}
                      />
                    ))}
                  </div>
                  <button onClick={() => saveEditCategory(cat.id)} className="text-[var(--dk-text-soft)]">
                    <IconCheck className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-[var(--dk-text)]">{cat.name}</span>
                  <button
                    onClick={() => startEditCategory(cat)}
                    className="text-[var(--dk-text-faint)] opacity-0 transition hover:text-[var(--dk-text)] group-hover:opacity-100"
                  >
                    <IconPencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="text-[var(--dk-text-faint)] opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                  >
                    <IconTrash className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          ))}

          {addingCategory ? (
            <div className="flex items-center gap-2 rounded-full bg-white/[0.06] py-1.5 pl-3 pr-2.5">
              <input
                autoFocus
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                placeholder="Nama kategori"
                className="w-24 border-b border-white/20 bg-transparent text-sm text-[var(--dk-text)] outline-none placeholder:text-[var(--dk-text-faint)]"
              />
              <div className="flex gap-1">
                {CATEGORY_COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewCatColor(c)}
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: c, boxShadow: newCatColor === c ? '0 0 0 2px white' : 'none' }}
                  />
                ))}
              </div>
              <button onClick={handleAddCategory} className="text-[var(--dk-text-soft)]">
                <IconCheck className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingCategory(true)}
              className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-sm text-[var(--dk-text-soft)] transition hover:bg-white/[0.1]"
            >
              <IconPlus className="h-3.5 w-3.5" />
              Tambah kategori
            </button>
          )}
        </div>
      </div>

      <div className="glass rounded-[28px] p-6">
        <div className="flex items-center justify-between">
          <p className="text-[18px] font-bold tracking-[-0.3px] text-[var(--dk-text)]">Semua Tasks</p>
          <button
            onClick={() => {
              resetForm()
              setFormOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-full bg-[var(--lav-600)] px-4 py-2 text-xs font-semibold text-white"
          >
            <IconPlus className="h-3.5 w-3.5" />
            Task Baru
          </button>
        </div>

        {formOpen && (
          <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-white/[0.04] p-4">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
                />
                <span className="text-xs text-[var(--dk-text-faint)]">s/d</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={!dueTime}
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
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
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

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={submitting || !title.trim()}
                className="flex-1 rounded-xl bg-[var(--lav-600)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {editingTaskId ? 'Simpan Perubahan' : 'Simpan'}
              </button>
              <button onClick={resetForm} className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm font-semibold text-[var(--dk-text-soft)]">
                Batal
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col">
          {tasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--dk-text-faint)]">Belum ada task.</p>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="group flex items-center gap-3 border-b border-white/[0.05] py-3 last:border-none">
                <button
                  onClick={() => handleToggle(task)}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    task.completed ? 'border-transparent bg-[var(--lav-600)]' : 'border-[var(--dk-text-faint)]'
                  }`}
                >
                  {task.completed && <IconCheck className="h-3.5 w-3.5 text-white" />}
                </button>

                <span
                  onClick={() => startEditTask(task)}
                  className={`min-w-0 flex-1 cursor-pointer text-sm ${
                    task.completed ? 'text-[var(--dk-text-soft)]' : 'text-[var(--dk-text)]'
                  }`}
                >
                  {task.title}
                </span>

                {task.recurrence_freq && (
                  <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-[var(--dk-text-soft)]">
                    {describeRecurrence({
                      freq: task.recurrence_freq as RecurrenceFreq,
                      interval: task.recurrence_interval,
                      daysOfWeek: task.recurrence_days_of_week,
                      until: task.recurrence_until,
                    })}
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

                <button
                  onClick={() => startEditTask(task)}
                  className="shrink-0 text-[var(--dk-text-faint)] opacity-0 transition hover:text-[var(--dk-text)] group-hover:opacity-100"
                >
                  <IconPencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteTask(task)}
                  className="shrink-0 text-[var(--dk-text-faint)] opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}