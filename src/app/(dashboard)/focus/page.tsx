import { createClient } from '@/utils/supabase/server'
import { FocusTimer } from '@/components/FocusTimer'
import { TodaySessionsList } from './TodaySessionsList'
import { WeeklyStatsCard } from './WeeklyStatsCard'
import { FocusStreakCard } from './FocusStreakCard'
import { PersonalRecordsCard } from './PersonalRecordsCard'

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfWeek(d: Date) {
  const x = startOfDay(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

function computeStreak(sessions: { started_at: string }[]) {
  const daySet = new Set(sessions.map((s) => new Date(s.started_at).toDateString()))
  let streak = 0
  const cursor = new Date()

  if (!daySet.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1)
  }

  while (daySet.has(cursor.toDateString())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function computePersonalRecords(sessions: { started_at: string; duration_minutes: number }[]) {
  let totalMinutes = 0
  let longestSession = 0
  const perDay = new Map<string, number>()

  for (const s of sessions) {
    totalMinutes += s.duration_minutes
    if (s.duration_minutes > longestSession) longestSession = s.duration_minutes
    const dayKey = new Date(s.started_at).toDateString()
    perDay.set(dayKey, (perDay.get(dayKey) ?? 0) + s.duration_minutes)
  }

  let bestDayMinutes = 0
  for (const v of perDay.values()) {
    if (v > bestDayMinutes) bestDayMinutes = v
  }

  return { totalMinutes, longestSession, bestDayMinutes }
}

export default async function FocusPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = startOfDay(new Date())
  const weekStart = startOfWeek(new Date())

  const { data: todaySessions } = await supabase
    .from('focus_sessions')
    .select('id, started_at, duration_minutes, technique_name')
    .eq('user_id', user!.id)
    .eq('completed', true)
    .gte('started_at', today.toISOString())
    .order('started_at', { ascending: false })

  const { data: allSessions } = await supabase
    .from('focus_sessions')
    .select('started_at, duration_minutes')
    .eq('user_id', user!.id)
    .eq('completed', true)
    .order('started_at', { ascending: false })

  const sessions = allSessions ?? []
  const weekSessions = sessions.filter((s) => new Date(s.started_at) >= weekStart)
  const streak = computeStreak(sessions)
  const { totalMinutes, longestSession, bestDayMinutes } = computePersonalRecords(sessions)

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr]">
      <FocusTimer />
      <div className="flex flex-col gap-5">
        <WeeklyStatsCard sessions={weekSessions} />
        <TodaySessionsList sessions={todaySessions ?? []} />
      </div>

      <FocusStreakCard streak={streak} />
      <PersonalRecordsCard
        totalMinutes={totalMinutes}
        longestSession={longestSession}
        bestDayMinutes={bestDayMinutes}
      />
    </div>
  )
}