import { createClient } from '@/utils/supabase/server'
import { FocusTimer } from '@/components/FocusTimer'
import { TasksCard } from '@/components/TasksCard'
import { WeatherCard } from '@/components/WeatherCard'
import { CalendarCard } from '@/components/CalendarCard'
import { TodayScheduleCard } from '@/components/TodayScheduleCard'
import { QuickNotesCard } from '@/components/QuickNotesCard'
import { MusicCard } from '@/components/MusicCard'
import { HabitTrackerCard } from '@/components/HabitTrackerCard'
import { Header } from './Header'

export default async function TodayPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user!.id)
    .single()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(
      'id, title, category, due_date, end_date, completed, recurrence_freq, recurrence_interval, recurrence_days_of_week, recurrence_until'
    )
    .eq('user_id', user!.id)
    .order('due_date', { ascending: true, nullsFirst: false })

  const { data: categories } = await supabase
    .from('task_categories')
    .select('id, name, color')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: true })

  const { data: quickNotes } = await supabase
    .from('quick_notes')
    .select('id, content')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const { data: habits } = await supabase
    .from('habits')
    .select('id, name')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: true })

  const { data: habitLogs } = await supabase
    .from('habit_logs')
    .select('habit_id, log_date')
    .eq('user_id', user!.id)

  return (
    <div className="flex flex-col gap-5">
      <Header displayName={profile?.display_name ?? 'kamu'} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_1.17fr_1fr]">
        <TasksCard tasks={tasks ?? []} categories={categories ?? []} />
        <FocusTimer />
        <WeatherCard />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.25fr_1.18fr]">
        <QuickNotesCard notes={quickNotes ?? []} />
        <CalendarCard tasks={tasks ?? []} />
        <TodayScheduleCard tasks={tasks ?? []} categories={categories ?? []} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.4fr]">
        <MusicCard />
        <HabitTrackerCard habits={habits ?? []} logs={habitLogs ?? []} />
      </div>
    </div>
  )
}