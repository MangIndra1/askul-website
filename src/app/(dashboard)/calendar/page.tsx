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
    .select('id, title, category, due_date, end_date, completed')
    .eq('user_id', user!.id)
    .order('due_date', { ascending: true, nullsFirst: false })

  return <CalendarPageClient tasks={tasks ?? []} googleConnectSlot={<GoogleCalendarConnect />} />
}