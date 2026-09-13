'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createTaskCategory(name: string, color: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase.from('task_categories').insert({ user_id: user.id, name, color })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/calendar')
  revalidatePath('/tasks')
  return { error: null }
}

export async function updateTaskCategory(id: string, name: string, color: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase
    .from('task_categories')
    .update({ name, color })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/calendar')
  revalidatePath('/tasks')
  return { error: null }
}

export async function deleteTaskCategory(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase.from('task_categories').delete().eq('id', id).eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/calendar')
  revalidatePath('/tasks')
  return { error: null }
}