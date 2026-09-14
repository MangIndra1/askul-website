import { categoryColor, type TaskCategory } from '@/lib/taskCategories'
import { occursOn, buildOccurrenceDueDate, type RecurrenceFreq } from '@/lib/recurrence'
import { computeAllClassOccurrences, type ClassSchedule, type ClassScheduleException } from '@/lib/classSchedule'

type Task = {
  id: string
  title: string
  category: string | null
  due_date: string | null
  end_date: string | null
  recurrence_freq: string | null
  recurrence_interval: number
  recurrence_days_of_week: number[] | null
  recurrence_until: string | null
  isClassSchedule?: boolean
  isCancelled?: boolean
}

function formatTime(dueDate: string) {
  const d = new Date(dueDate)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${hh}:${mm}`
}

// Heuristik: kalau jamnya persis 00:00, dianggap "nggak diisi jam spesifik"
function hasExplicitTime(dueDate: string) {
  const d = new Date(dueDate)
  return !(d.getHours() === 0 && d.getMinutes() === 0)
}

export function TodayScheduleCard({
  tasks,
  categories,
  schedules = [],
  exceptions = [],
}: {
  tasks: Task[]
  categories: TaskCategory[]
  schedules?: ClassSchedule[]
  exceptions?: ClassScheduleException[]
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Task biasa (bukan berulang) yang due_date-nya emang hari ini.
  const directTasks = tasks.filter((t) => {
    if (t.recurrence_freq) return false
    if (!t.due_date) return false
    const d = new Date(t.due_date)
    return d >= today && d < tomorrow
  })

  // Task BERULANG yang punya kemunculan hari ini — dibikinkan due_date
  // "virtual" (tanggal hari ini, jam tetap dari aslinya) biar tampilannya
  // konsisten sama task biasa.
  const recurringToday = tasks
    .filter((t): t is Task & { due_date: string; recurrence_freq: string } => Boolean(t.recurrence_freq && t.due_date))
    .filter((t) =>
      occursOn(
        t.due_date,
        {
          freq: t.recurrence_freq as RecurrenceFreq,
          interval: t.recurrence_interval,
          daysOfWeek: t.recurrence_days_of_week,
          until: t.recurrence_until,
        },
        today
      )
    )
    .map((t) => ({ ...t, id: `${t.id}_today`, due_date: buildOccurrenceDueDate(t.due_date, today) }))

  // Kemunculan jadwal kuliah hari ini (termasuk yang dibatalkan — ditandain
  // strikethrough, biar kelihatan sebagai pengingat "hari ini libur").
  const classToday = computeAllClassOccurrences(schedules, exceptions, today, today).map((occ) => ({
    id: occ.id,
    title: occ.title,
    category: occ.category,
    due_date: `${occ.date}T${occ.startTime}:00`,
    end_date: `${occ.date}T${occ.endTime}:00`,
    recurrence_freq: null,
    recurrence_interval: 1,
    recurrence_days_of_week: null,
    recurrence_until: null,
    isClassSchedule: true,
    isCancelled: occ.isCancelled,
  }))

  const todayTasks = [...directTasks, ...recurringToday, ...classToday]

  const timed = todayTasks
    .filter((t) => hasExplicitTime(t.due_date as string))
    .sort((a, b) => new Date(a.due_date as string).getTime() - new Date(b.due_date as string).getTime())
  const allDay = todayTasks.filter((t) => !hasExplicitTime(t.due_date as string))
  const ordered = [...timed, ...allDay]

  return (
    <div className="glass rounded-[28px] p-6">
      <p className="text-[18px] font-bold tracking-[-0.3px] text-[var(--dk-text)]">Today&apos;s Schedule</p>

      {ordered.length === 0 ? (
        <p className="mt-6 text-center text-sm text-[var(--dk-text-faint)]">Nggak ada jadwal hari ini.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {ordered.map((task) => {
            const color = categoryColor(categories, task.category)
            const startLabel = hasExplicitTime(task.due_date as string) ? formatTime(task.due_date as string) : null
            const endLabel = task.end_date ? formatTime(task.end_date) : null
            const isRecurring = Boolean(task.recurrence_freq)

            return (
              <div
                key={task.id}
                className="flex gap-3 rounded-xl bg-white/[0.03] py-3 pl-4 pr-3"
                style={{ borderLeft: `5px solid ${color}` }}
              >
                <div className="flex w-12 shrink-0 flex-col text-xs text-[var(--dk-text-faint)]">
                  {startLabel ? (
                    <>
                      <span>{startLabel}</span>
                      {endLabel && <span>{endLabel}</span>}
                    </>
                  ) : (
                    <span>Semua hari</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <p
                      className={`truncate text-sm font-semibold ${
                        task.isCancelled ? 'text-[var(--dk-text-faint)] line-through' : 'text-[var(--dk-text)]'
                      }`}
                    >
                      {isRecurring && '↻ '}
                      {task.isClassSchedule && '🎓 '}
                      {task.category ?? task.title}
                    </p>
                  </div>
                  {task.category && (
                    <p className="mt-0.5 truncate pl-3.5 text-xs text-[var(--dk-text-faint)]">
                      {task.title}
                      {task.isCancelled && ' · Dibatalkan'}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}