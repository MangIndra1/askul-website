'use client'

import { useState, useMemo, Fragment, type ReactNode } from 'react'
import { createTask } from '@/app/actions/tasks'
import { TASK_CATEGORIES, categoryColor } from '@/lib/taskCategories'

type Task = {
  id: string
  title: string
  category: string | null
  due_date: string | null
  end_date: string | null
  completed: boolean
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

// Getter tanggal LOKAL (bukan .toISOString() yang convert UTC dulu).
function toDateKey(d: Date) {
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${hh}:${mm}`
}

function hasExplicitTime(dateStr: string) {
  const d = new Date(dateStr)
  return !(d.getHours() === 0 && d.getMinutes() === 0)
}

const HEATMAP_DAYS = 10

function opacityByCount(count: number) {
  if (count === 0) return 0.06
  if (count === 1) return 0.35
  if (count === 2) return 0.6
  if (count === 3) return 0.85
  return 1
}

const MAX_LANES = 3

type TaskBar = { task: Task; startCol: number; endCol: number; isStart: boolean; isEnd: boolean }

// Susun bar-bar yang overlap ke "lane" terpisah (persis logic yang dipakai
// calendar app pada umumnya) — greedy: taruh di lane pertama yang nggak
// bentrok, kalau nggak ada bikin lane baru.
function assignLanes(items: TaskBar[]): TaskBar[][] {
  const lanes: TaskBar[][] = []
  for (const item of items) {
    let placed = false
    for (const lane of lanes) {
      const conflict = lane.some((l) => !(item.endCol < l.startCol || item.startCol > l.endCol))
      if (!conflict) {
        lane.push(item)
        placed = true
        break
      }
    }
    if (!placed) lanes.push([item])
  }
  return lanes
}

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
function IconPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function CalendarPageClient({
  tasks,
  googleConnectSlot,
}: {
  tasks: Task[]
  googleConnectSlot?: ReactNode
}) {
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [multiDay, setMultiDay] = useState(false)
  const [multiDayEnd, setMultiDayEnd] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const today = new Date()

  // Dikelompokkan per MINGGU (bukan flat 42 sel) — biar gampang dipakai
  // buat nentuin span kolom bar per minggu.
  const weeks = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const startWeekday = (firstDay.getDay() + 6) % 7 // Sen=0 ... Min=6
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (number | null)[] = [
      ...Array(startWeekday).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ]
    while (cells.length % 7 !== 0) cells.push(null)
    const result: (number | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7))
    }
    return result
  }, [year, month])

  // Task per tanggal (buat panel detail + titik di sel) — task multi-hari
  // dimasukin ke SETIAP tanggal yang dia lewatin.
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of tasks) {
      if (!t.due_date) continue
      const start = new Date(t.due_date)
      const startKey = toDateKey(start)

      if (t.end_date) {
        const end = new Date(t.end_date)
        const endKey = toDateKey(end)
        if (endKey !== startKey) {
          const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate())
          const lastDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
          while (cursor <= lastDay) {
            const key = toDateKey(cursor)
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(t)
            cursor.setDate(cursor.getDate() + 1)
          }
          continue
        }
      }

      if (!map.has(startKey)) map.set(startKey, [])
      map.get(startKey)!.push(t)
    }
    return map
  }, [tasks])

  // Bar per minggu: tiap task jadi SATU balok yang span beberapa kolom
  // sekaligus (pakai CSS grid-column), bukan potongan chip per hari.
  const weekLanes = useMemo(() => {
    return weeks.map((week) => {
      const items: TaskBar[] = []
      for (const t of tasks) {
        if (!t.due_date) continue
        const taskStart = new Date(t.due_date)
        taskStart.setHours(0, 0, 0, 0)
        const taskEnd = t.end_date ? new Date(t.end_date) : new Date(t.due_date)
        taskEnd.setHours(0, 0, 0, 0)
        const taskStartKey = toDateKey(taskStart)
        const taskEndKey = toDateKey(taskEnd)

        let startCol = -1
        let endCol = -1
        for (let col = 0; col < 7; col++) {
          const day = week[col]
          if (day === null) continue
          const cellDate = new Date(year, month, day)
          if (cellDate >= taskStart && cellDate <= taskEnd) {
            if (startCol === -1) startCol = col
            endCol = col
          }
        }
        if (startCol === -1) continue

        const segStartKey = toDateKey(new Date(year, month, week[startCol] as number))
        const segEndKey = toDateKey(new Date(year, month, week[endCol] as number))
        items.push({
          task: t,
          startCol,
          endCol,
          isStart: segStartKey === taskStartKey,
          isEnd: segEndKey === taskEndKey,
        })
      }
      items.sort((a, b) => a.startCol - b.startCol || b.endCol - b.startCol - (a.endCol - a.startCol))
      return assignLanes(items)
    })
  }, [tasks, weeks, year, month])

  // Data heatmap aktivitas per kategori — rolling window terakhir, nggak
  // terikat bulan yang lagi dinavigasi di grid.
  const heatmapDates = useMemo(() => {
    const dates: Date[] = []
    const now = new Date()
    for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      dates.push(d)
    }
    return dates
  }, [])

  const heatmapCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of tasks) {
      if (!t.due_date || !t.category) continue
      const key = `${t.category}_${toDateKey(new Date(t.due_date))}`
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [tasks])

  const selectedKey = toDateKey(selectedDate)
  const selectedTasks = (tasksByDate.get(selectedKey) ?? [])
    .slice()
    .sort((a, b) => {
      const at = a.due_date ? new Date(a.due_date).getTime() : 0
      const bt = b.due_date ? new Date(b.due_date).getTime() : 0
      return at - bt
    })

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1))
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1))
  }
  function goToday() {
    const now = new Date()
    setViewDate(now)
    setSelectedDate(now)
  }

  async function handleAdd() {
    if (!title.trim()) return
    setSubmitting(true)
    const dateStr = toDateKey(selectedDate)

    let combinedDue: string
    let combinedEnd: string | null

    if (multiDay && multiDayEnd) {
      combinedDue = `${dateStr}T00:00:00`
      combinedEnd = `${multiDayEnd}T23:59:59`
    } else {
      combinedDue = `${dateStr}T${startTime || '00:00'}:00`
      combinedEnd = startTime && endTime ? `${dateStr}T${endTime}:00` : null
    }

    await createTask({
      title: title.trim(),
      category: category || null,
      dueDate: combinedDue,
      endDate: combinedEnd,
    })
    setTitle('')
    setCategory('')
    setStartTime('')
    setEndTime('')
    setMultiDay(false)
    setMultiDayEnd('')
    setAdding(false)
    setSubmitting(false)
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
      <div className="glass flex h-full min-h-0 flex-col overflow-y-auto rounded-[28px] p-6">
        <div className="flex items-center justify-between">
          <p className="text-[18px] font-bold tracking-[-0.3px] text-[var(--dk-text)]">Calendar</p>
          <button
            onClick={goToday}
            className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-[var(--dk-text-soft)] transition hover:bg-white/[0.1]"
          >
            Hari ini
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--dk-text-soft)] transition hover:bg-white/[0.06]"
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-base font-semibold text-[var(--dk-text)]">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--dk-text-soft)] transition hover:bg-white/[0.06]"
          >
            <IconChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {DAY_LABELS.map((d) => (
            <span key={d} className="pb-1 text-center text-[11px] font-medium text-[var(--dk-text-faint)]">
              {d}
            </span>
          ))}
        </div>

        <div className="mt-1 flex flex-col gap-2.5">
          {weeks.map((week, wi) => {
            const lanes = weekLanes[wi] ?? []
            const overflow = lanes.length - MAX_LANES

            return (
              <div key={wi} className="flex flex-col gap-1">
                <div className="grid grid-cols-7 gap-1.5">
                  {week.map((day, di) => {
                    if (day === null) return <div key={di} />
                    const cellDate = new Date(year, month, day)
                    const cellKey = toDateKey(cellDate)
                    const isToday = toDateKey(today) === cellKey
                    const isSelected = selectedKey === cellKey
                    return (
                      <button
                        key={di}
                        onClick={() => setSelectedDate(cellDate)}
                        className="flex justify-start"
                      >
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition ${
                            isToday
                              ? 'bg-[var(--lav-600)] font-semibold text-white'
                              : isSelected
                                ? 'text-[var(--dk-text)] ring-1 ring-[var(--lav-400)]'
                                : 'text-[var(--dk-text-soft)] hover:bg-white/[0.06]'
                          }`}
                        >
                          {day}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {Array.from({ length: MAX_LANES }).map((_, li) => {
                  const lane = weekLanes[wi]?.[li]
                  return (
                    <div key={li} className="grid h-[18px] grid-cols-7 gap-1.5">
                      {lane?.map((bar) => (
                        <span
                          key={bar.task.id}
                          className={`truncate px-1.5 py-0.5 text-[10px] font-medium text-white ${
                            bar.isStart ? 'rounded-l' : ''
                          } ${bar.isEnd ? 'rounded-r' : ''}`}
                          style={{
                            gridColumnStart: bar.startCol + 1,
                            gridColumnEnd: bar.endCol + 2,
                            backgroundColor: categoryColor(bar.task.category),
                          }}
                          title={bar.task.title}
                        >
                          {bar.task.title}
                        </span>
                      ))}
                    </div>
                  )
                })}

                <div className="h-[14px] px-1 text-[10px] text-[var(--dk-text-faint)]">
                  {overflow > 0 ? `+${overflow} lainnya` : ''}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {googleConnectSlot && <div className="w-full">{googleConnectSlot}</div>}
        <div className="glass flex flex-col rounded-[28px] p-6">
          <p className="text-[18px] font-bold tracking-[-0.3px] text-[var(--dk-text)]">
            {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          <div className="mt-4 flex max-h-[280px] flex-col gap-3 overflow-y-auto pr-1">
            {selectedTasks.length === 0 ? (
              <p className="py-4 text-center text-sm text-[var(--dk-text-faint)]">Nggak ada task di hari ini.</p>
            ) : (
              selectedTasks.map((task) => {
                const color = categoryColor(task.category)
                const startKey = task.due_date ? toDateKey(new Date(task.due_date)) : null
                const endKey = task.end_date ? toDateKey(new Date(task.end_date)) : startKey
                const isMultiDay = startKey !== endKey
                const timed = task.due_date ? hasExplicitTime(task.due_date) : false
                return (
                  <div
                    key={task.id}
                    className="flex gap-3 rounded-xl bg-white/[0.03] py-2.5 pl-3 pr-3"
                    style={{ borderLeft: `5px solid ${color}` }}
                  >
                    <div className="flex w-14 shrink-0 flex-col text-[11px] text-[var(--dk-text-faint)]">
                      {isMultiDay ? (
                        <>
                          <span>{new Date(task.due_date as string).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                          <span>s/d {new Date(task.end_date as string).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        </>
                      ) : timed ? (
                        <>
                          <span>{formatTime(task.due_date as string)}</span>
                          {task.end_date && <span>{formatTime(task.end_date)}</span>}
                        </>
                      ) : (
                        <span>Semua hari</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        <p className="truncate text-sm font-semibold text-[var(--dk-text)]">
                          {task.category ?? task.title}
                        </p>
                      </div>
                      {task.category && (
                        <p className="mt-0.5 truncate pl-3.5 text-xs text-[var(--dk-text-faint)]">{task.title}</p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="mt-4 border-t border-white/[0.08] pt-4">
            {adding ? (
              <div className="flex flex-col gap-2">
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
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={multiDay}
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)] disabled:opacity-40"
                  />
                  <span className="text-xs text-[var(--dk-text-faint)]">s/d</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={!startTime || multiDay}
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)] disabled:opacity-40"
                  />
                </div>

                <label className="flex items-center gap-2 px-1 text-xs text-[var(--dk-text-soft)]">
                  <input
                    type="checkbox"
                    checked={multiDay}
                    onChange={(e) => setMultiDay(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[var(--lav-600)]"
                  />
                  Acara multi-hari
                </label>

                {multiDay && (
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-xs text-[var(--dk-text-faint)]">s/d tanggal</span>
                    <input
                      type="date"
                      value={multiDayEnd}
                      onChange={(e) => setMultiDayEnd(e.target.value)}
                      min={toDateKey(selectedDate)}
                      className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
                    />
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
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-[var(--dk-text-soft)] transition hover:bg-white/[0.1] hover:text-[var(--dk-text)]"
              >
                <IconPlus className="h-4 w-4" />
                Add Task untuk hari ini
              </button>
            )}
          </div>
        </div>

        <div className="glass rounded-[28px] p-6">
          <p className="text-[18px] font-bold tracking-[-0.3px] text-[var(--dk-text)]">Aktivitas per Kategori</p>
          <p className="mt-1 text-xs text-[var(--dk-text-faint)]">{HEATMAP_DAYS} hari terakhir</p>

          <div className="mt-4 overflow-x-auto">
            <div className="grid min-w-[380px] gap-1" style={{ gridTemplateColumns: `68px repeat(${HEATMAP_DAYS}, 1fr)` }}>
              <span />
              {heatmapDates.map((d) => (
                <span key={toDateKey(d)} className="text-center text-[9px] text-[var(--dk-text-faint)]">
                  {d.getDate()}
                </span>
              ))}

              {TASK_CATEGORIES.map((c) => (
                <Fragment key={c.value}>
                  <span className="flex items-center truncate text-xs text-[var(--dk-text-soft)]">{c.value}</span>
                  {heatmapDates.map((d) => {
                    const key = `${c.value}_${toDateKey(d)}`
                    const count = heatmapCounts.get(key) ?? 0
                    return (
                      <div
                        key={key}
                        title={`${c.value}, ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}: ${count} task`}
                        className="aspect-square rounded-md"
                        style={{ backgroundColor: c.color, opacity: opacityByCount(count) }}
                      />
                    )
                  })}
                </Fragment>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-[var(--dk-text-faint)]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-white/[0.06]" /> Kosong
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[var(--lav-400)]" style={{ opacity: 0.35 }} /> Rendah
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[var(--lav-400)]" /> Tinggi
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}