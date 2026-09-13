'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { hasGoogleConnection, pushTaskToGoogle, updateGoogleEvent, deleteGoogleEvent } from '@/lib/googleCalendar'

export async function createTask({
  title,
  category,
  dueDate,
  endDate,
}: {
  title: string
  category: string | null
  dueDate: string | null
  endDate: string | null
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { data: inserted, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title,
      category,
      due_date: dueDate,
      end_date: endDate,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  // Sync ke Google Calendar — best effort. Kalau gagal (belum connect,
  // token bermasalah, dst), task AsKul-nya tetap kesimpen normal, cuma
  // sync-nya yang nggak jalan.
  if (dueDate && (await hasGoogleConnection(user.id))) {
    const eventId = await pushTaskToGoogle(user.id, { title, category, due_date: dueDate, end_date: endDate })
    if (eventId) {
      await supabase.from('tasks').update({ google_event_id: eventId }).eq('id', inserted.id)
    }
  }

  revalidatePath('/')
  return { error: null }
}

export async function updateTaskTitle(id: string, title: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { data: existing } = await supabase
    .from('tasks')
    .select('category, due_date, end_date, google_event_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase.from('tasks').update({ title }).eq('id', id).eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  if (existing?.google_event_id) {
    await updateGoogleEvent(user.id, existing.google_event_id, {
      title,
      category: existing.category,
      due_date: existing.due_date,
      end_date: existing.end_date,
    })
  }

  revalidatePath('/')
  return { error: null }
}

export async function deleteTask(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { data: existing } = await supabase
    .from('tasks')
    .select('google_event_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  if (existing?.google_event_id) {
    await deleteGoogleEvent(user.id, existing.google_event_id)
  }

  revalidatePath('/')
  return { error: null }
}

export async function toggleTaskCompleted(taskId: string, completed: boolean) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase
    .from('tasks')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', taskId)
    .eq('user_id', user.id)

  // Catatan: XP otomatis nambah lewat trigger on_task_completed
  // yang udah kita buat di Fase 0 — nggak perlu di-handle manual di sini.
  // Status selesai/belum sengaja NGGAK di-sync ke Google Calendar — itu
  // bukan konsep yang relevan buat sebuah event kalender.

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}