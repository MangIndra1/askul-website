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

  const { data: schedules } = await supabase
    .from('class_schedules')
    .select('id, title, category, day_of_week, start_time, end_time, semester_start, semester_end')
    .eq('user_id', user!.id)

  const { data: exceptions } = await supabase
    .from('class_schedule_exceptions')
    .select('id, schedule_id, original_date, is_cancelled, override_date, override_start_time, override_end_time')
    .eq('user_id', user!.id)

  return (
    <CalendarPageClient
      tasks={tasks ?? []}
      categories={categories ?? []}
      schedules={schedules ?? []}
      exceptions={exceptions ?? []}
      googleConnectSlot={<GoogleCalendarConnect />}
    />
  )
}