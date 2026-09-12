'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createHabit(name: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase.from('habits').insert({ user_id: user.id, name })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}

export async function updateHabit(id: string, name: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase.from('habits').update({ name }).eq('id', id).eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}

export async function deleteHabit(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  // habit_logs otomatis ikut kehapus lewat "on delete cascade"
  // yang udah kita set di foreign key-nya — nggak perlu cleanup manual.
  const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}

export async function toggleHabitLog(habitId: string, dateStr: string, checked: boolean) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  if (checked) {
    const { error } = await supabase
      .from('habit_logs')
      .insert({ habit_id: habitId, user_id: user.id, log_date: dateStr })
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('log_date', dateStr)
      .eq('user_id', user.id)
    if (error) return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}