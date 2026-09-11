'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createTask({
  title,
  dueDate,
}: {
  title: string
  dueDate: string | null
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase.from('tasks').insert({
    user_id: user.id,
    title,
    due_date: dueDate,
  })

  if (error) {
    return { error: error.message }
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

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}