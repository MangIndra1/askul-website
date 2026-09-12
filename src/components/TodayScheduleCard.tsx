import { categoryColor } from '@/lib/taskCategories'

type Task = {
  id: string
  title: string
  category: string | null
  due_date: string | null
  end_date: string | null
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

export function TodayScheduleCard({ tasks }: { tasks: Task[] }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayTasks = tasks.filter((t) => {
    if (!t.due_date) return false
    const d = new Date(t.due_date)
    return d >= today && d < tomorrow
  })

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
            const color = categoryColor(task.category)
            const startLabel = hasExplicitTime(task.due_date as string) ? formatTime(task.due_date as string) : null
            const endLabel = task.end_date ? formatTime(task.end_date) : null

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
          })}
        </div>
      )}
    </div>
  )
}