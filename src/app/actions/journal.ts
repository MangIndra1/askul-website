'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createJournalEntry(content: string, mood: string | null, photoPath: string | null) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase
    .from('journal_entries')
    .insert({ user_id: user.id, content, mood, photo_path: photoPath })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/journal')
  return { error: null }
}

export async function updateJournalEntry(
  id: string,
  content: string,
  mood: string | null,
  photoPath: string | null,
  removedPhotoPath: string | null
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase
    .from('journal_entries')
    .update({ content, mood, photo_path: photoPath })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  // Foto lama diganti/dihapus pas edit — bersihin file lamanya dari
  // Storage biar nggak numpuk sampah.
  if (removedPhotoPath) {
    await supabase.storage.from('journal-photos').remove([removedPhotoPath])
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

  const { data: existing } = await supabase
    .from('journal_entries')
    .select('photo_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase.from('journal_entries').delete().eq('id', id).eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  if (existing?.photo_path) {
    await supabase.storage.from('journal-photos').remove([existing.photo_path])
  }

  revalidatePath('/journal')
  return { error: null }
}