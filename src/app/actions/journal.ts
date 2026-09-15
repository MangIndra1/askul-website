'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createJournalEntry(content: string, mood: string | null) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase.from('journal_entries').insert({ user_id: user.id, content, mood })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/journal')
  return { error: null }
}

export async function updateJournalEntry(id: string, content: string, mood: string | null) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase
    .from('journal_entries')
    .update({ content, mood })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/journal')
  return { error: null }
}

export async function deleteJournalEntry(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase.from('journal_entries').delete().eq('id', id).eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/journal')
  return { error: null }
}