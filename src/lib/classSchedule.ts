export type ClassSchedule = {
  id: string
  title: string
  category: string | null
  day_of_week: number
  start_time: string
  end_time: string
  semester_start: string
  semester_end: string
}

export type ClassScheduleException = {
  id: string
  schedule_id: string
  original_date: string
  is_cancelled: boolean
  override_date: string | null
  override_start_time: string | null
  override_end_time: string | null
}

export type ClassOccurrence = {
  id: string // scheduleId_originalDate — unik per kemunculan
  scheduleId: string
  title: string
  category: string | null
  date: string // tanggal AKTUAL ditampilin (udah lewat override kalau ada)
  originalDate: string
  startTime: string
  endTime: string
  isCancelled: boolean
  isRescheduled: boolean
}

function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Hitung semua kemunculan 1 jadwal dalam rentang [rangeStart, rangeEnd].
// Window generate expected-date-nya sengaja dilebarin dikit (+/- 7 hari)
// dari rentang tampilan, biar kemunculan yang DIPINDAH dari luar rentang
// tapi jatuhnya MASIH deket, tetap ketangkep.
export function computeClassOccurrences(
  schedule: ClassSchedule,
  exceptions: ClassScheduleException[],
  rangeStart: Date,
  rangeEnd: Date
): ClassOccurrence[] {
  const semStart = new Date(`${schedule.semester_start}T00:00:00`)
  const semEnd = new Date(`${schedule.semester_end}T00:00:00`)

  const genStart = new Date(rangeStart)
  genStart.setDate(genStart.getDate() - 7)
  const genEnd = new Date(rangeEnd)
  genEnd.setDate(genEnd.getDate() + 7)

  const loopStart = semStart > genStart ? semStart : genStart
  const loopEnd = semEnd < genEnd ? semEnd : genEnd
  if (loopStart > loopEnd) return []

  const cursor = new Date(loopStart)
  while (cursor.getDay() !== schedule.day_of_week && cursor <= loopEnd) {
    cursor.setDate(cursor.getDate() + 1)
  }

  const exceptionMap = new Map(exceptions.map((e) => [e.original_date, e]))
  const results: ClassOccurrence[] = []

  while (cursor <= loopEnd) {
    const originalDate = toDateKey(cursor)
    const exception = exceptionMap.get(originalDate)

    if (exception?.is_cancelled) {
      results.push({
        id: `${schedule.id}_${originalDate}`,
        scheduleId: schedule.id,
        title: schedule.title,
        category: schedule.category,
        date: originalDate,
        originalDate,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        isCancelled: true,
        isRescheduled: false,
      })
    } else {
      const actualDate = exception?.override_date ?? originalDate
      const actualStart = exception?.override_start_time ?? schedule.start_time
      const actualEnd = exception?.override_end_time ?? schedule.end_time
      const actualDateObj = new Date(`${actualDate}T00:00:00`)

      if (actualDateObj >= rangeStart && actualDateObj <= rangeEnd) {
        results.push({
          id: `${schedule.id}_${originalDate}`,
          scheduleId: schedule.id,
          title: schedule.title,
          category: schedule.category,
          date: actualDate,
          originalDate,
          startTime: actualStart,
          endTime: actualEnd,
          isCancelled: false,
          isRescheduled: Boolean(exception?.override_date),
        })
      }
    }

    cursor.setDate(cursor.getDate() + 7)
  }

  return results
}

export function computeAllClassOccurrences(
  schedules: ClassSchedule[],
  exceptions: ClassScheduleException[],
  rangeStart: Date,
  rangeEnd: Date
): ClassOccurrence[] {
  return schedules.flatMap((s) =>
    computeClassOccurrences(
      s,
      exceptions.filter((e) => e.schedule_id === s.id),
      rangeStart,
      rangeEnd
    )
  )
}