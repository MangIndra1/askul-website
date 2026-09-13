export type RecurrenceFreq = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type RecurrenceRule = {
  freq: RecurrenceFreq
  interval: number
  daysOfWeek: number[] | null // 0=Min...6=Sab (konvensi Date.getDay()), cuma dipakai kalau freq='weekly'
  until: string | null // 'YYYY-MM-DD', null = tanpa batas
}

export const RECURRENCE_LABELS: Record<RecurrenceFreq, string> = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  yearly: 'Tahunan',
}

export const DAY_OF_WEEK_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// Cek apakah `checkDate` adalah salah satu kemunculan dari task yang
// due date aslinya `startDateStr`, mengikuti `rule`.
export function occursOn(startDateStr: string, rule: RecurrenceRule, checkDate: Date): boolean {
  const start = stripTime(new Date(startDateStr.slice(0, 10) + 'T00:00:00'))
  const check = stripTime(checkDate)

  if (check < start) return false
  if (rule.until) {
    const until = stripTime(new Date(rule.until + 'T00:00:00'))
    if (check > until) return false
  }

  const msPerDay = 24 * 60 * 60 * 1000

  if (rule.freq === 'daily') {
    const diffDays = Math.round((check.getTime() - start.getTime()) / msPerDay)
    return diffDays >= 0 && diffDays % rule.interval === 0
  }

  if (rule.freq === 'weekly') {
    const days = rule.daysOfWeek && rule.daysOfWeek.length > 0 ? rule.daysOfWeek : [start.getDay()]
    if (!days.includes(check.getDay())) return false
    const startWeekStart = new Date(start)
    startWeekStart.setDate(start.getDate() - start.getDay())
    const checkWeekStart = new Date(check)
    checkWeekStart.setDate(check.getDate() - check.getDay())
    const diffWeeks = Math.round((checkWeekStart.getTime() - startWeekStart.getTime()) / (msPerDay * 7))
    return diffWeeks >= 0 && diffWeeks % rule.interval === 0
  }

  if (rule.freq === 'monthly') {
    if (check.getDate() !== start.getDate()) return false
    const diffMonths = (check.getFullYear() - start.getFullYear()) * 12 + (check.getMonth() - start.getMonth())
    return diffMonths >= 0 && diffMonths % rule.interval === 0
  }

  if (rule.freq === 'yearly') {
    if (check.getDate() !== start.getDate() || check.getMonth() !== start.getMonth()) return false
    const diffYears = check.getFullYear() - start.getFullYear()
    return diffYears >= 0 && diffYears % rule.interval === 0
  }

  return false
}

// Semua tanggal kemunculan dalam rentang [rangeStart, rangeEnd] (inklusif).
// Aman dipakai buat rentang pendek (misal 1 bulan tampilan kalender).
export function occurrencesInRange(startDateStr: string, rule: RecurrenceRule, rangeStart: Date, rangeEnd: Date): Date[] {
  const results: Date[] = []
  const cursor = stripTime(rangeStart)
  const end = stripTime(rangeEnd)
  while (cursor <= end) {
    if (occursOn(startDateStr, rule, cursor)) {
      results.push(new Date(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return results
}

export function describeRecurrence(rule: RecurrenceRule): string {
  const n = rule.interval
  switch (rule.freq) {
    case 'daily':
      return n === 1 ? 'Tiap hari' : `Tiap ${n} hari`
    case 'weekly': {
      const dayNames = (rule.daysOfWeek ?? []).map((d) => DAY_OF_WEEK_LABELS[d]).join(', ')
      const base = n === 1 ? 'Tiap minggu' : `Tiap ${n} minggu`
      return dayNames ? `${base} (${dayNames})` : base
    }
    case 'monthly':
      return n === 1 ? 'Tiap bulan' : `Tiap ${n} bulan`
    case 'yearly':
      return n === 1 ? 'Tiap tahun' : `Tiap ${n} tahun`
  }
}

// Bikin due_date "virtual" buat satu kemunculan task berulang — tanggal
// diambil dari occurrenceDate, tapi jam & offset-nya tetap dari due_date
// ASLI si task (biar jam kemunculannya konsisten tiap kali).
export function buildOccurrenceDueDate(originalDueDate: string, occurrenceDate: Date): string {
  const timePart = originalDueDate.slice(11) // "HH:mm:ss+08:00" dst, apa adanya
  const yyyy = occurrenceDate.getFullYear()
  const mm = (occurrenceDate.getMonth() + 1).toString().padStart(2, '0')
  const dd = occurrenceDate.getDate().toString().padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${timePart}`
}