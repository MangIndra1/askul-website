import { createClient } from '@/utils/supabase/server'
import { TasksPageClient } from '@/components/TasksPageClient'

export default async function TasksPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: categories } = await supabase
    .from('task_categories')
    .select('id, name, color')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: true })

  const { data: tasks } = await supabase
    .from('tasks')
    .select(
      'id, title, category, due_date, end_date, completed, recurrence_freq, recurrence_interval, recurrence_days_of_week, recurrence_until'
    )
    .eq('user_id', user!.id)
    .order('due_date', { ascending: true, nullsFirst: false })

  return <TasksPageClient categories={categories ?? []} tasks={tasks ?? []} />
}