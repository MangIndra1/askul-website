'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createQuickNote(content: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase.from('quick_notes').insert({ user_id: user.id, content })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}

export async function deleteQuickNote(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase.from('quick_notes').delete().eq('id', id).eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}