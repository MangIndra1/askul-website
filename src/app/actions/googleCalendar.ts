'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { pushTaskToGoogle, fetchGoogleEvents } from '@/lib/googleCalendar'

export async function disconnectGoogleCalendar() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { data: connection } = await supabase
    .from('google_calendar_connections')
    .select('access_token')
    .eq('user_id', user.id)
    .maybeSingle()

  if (connection?.access_token) {
    // Revoke token beneran ke Google (bukan cuma hapus record lokal) —
    // biar akses yang udah diizinkan juga dicabut di sisi Google.
    await fetch(`https://oauth2.googleapis.com/revoke?token=${connection.access_token}`, {
      method: 'POST',
    }).catch(() => {})
  }

  const { error } = await supabase.from('google_calendar_connections').delete().eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/calendar')
  return { error: null }
}

export async function syncAllTasksToGoogle() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login', synced: 0 }
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, category, due_date, end_date, recurrence_freq, recurrence_interval, recurrence_days_of_week, recurrence_until')
    .eq('user_id', user.id)
    .not('due_date', 'is', null)
    .is('google_event_id', null)

  if (!tasks || tasks.length === 0) {
    return { error: null, synced: 0 }
  }

  let synced = 0
  for (const task of tasks) {
    const eventId = await pushTaskToGoogle(user.id, {
      title: task.title,
      category: task.category,
      due_date: task.due_date,
      end_date: task.end_date,
      recurrenceFreq: task.recurrence_freq,
      recurrenceInterval: task.recurrence_interval,
      recurrenceDaysOfWeek: task.recurrence_days_of_week,
      recurrenceUntil: task.recurrence_until,
    })
    if (eventId) {
      await supabase.from('tasks').update({ google_event_id: eventId }).eq('id', task.id)
      synced++
    }
  }

  revalidatePath('/')
  revalidatePath('/calendar')
  return { error: null, synced }
}

export async function getGoogleEventsForRange(timeMin: string, timeMax: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const [events, { data: ownTasks }] = await Promise.all([
    fetchGoogleEvents(user.id, timeMin, timeMax),
    supabase.from('tasks').select('google_event_id').eq('user_id', user.id).not('google_event_id', 'is', null),
  ])

  // Buang event yang sebenernya ASAL-nya dari AsKul sendiri (udah kepush
  // ke Google sebelumnya) — biar nggak dobel-tampil pas di-pull balik.
  // Dicek dua arah: ID event-nya sendiri, ATAU (buat instance recurring
  // hasil expand) recurringEventId-nya yang mengarah ke event master kita.
  const ownEventIds = new Set((ownTasks ?? []).map((t) => t.google_event_id).filter(Boolean))

  return events.filter((e) => !ownEventIds.has(e.id) && !(e.recurringEventId && ownEventIds.has(e.recurringEventId)))
}