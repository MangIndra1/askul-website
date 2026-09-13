import { createClient } from '@/utils/supabase/server'
import { CalendarPageClient } from '@/components/CalendarPageClient'
import { GoogleCalendarConnect } from '@/components/GoogleCalendarConnect'

export default async function CalendarPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  return (
    <CalendarPageClient
      tasks={tasks ?? []}
      categories={categories ?? []}
      googleConnectSlot={<GoogleCalendarConnect />}
    />
  )
}