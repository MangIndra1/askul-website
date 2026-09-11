import { createClient } from '@/utils/supabase/server'
import { FocusTimer } from '@/components/FocusTimer'
import { TasksCard } from '@/components/TasksCard'
import { WeatherCard } from '@/components/WeatherCard'
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
    .select('id, title, due_date, completed')
    .eq('user_id', user!.id)
    .order('due_date', { ascending: true, nullsFirst: false })

  return (
    <div className="flex flex-col gap-5">
      <Header displayName={profile?.display_name ?? 'kamu'} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_1.17fr_1fr]">
        <TasksCard tasks={tasks ?? []} />
        <FocusTimer />
        <WeatherCard />
      </div>
    </div>
  )
}