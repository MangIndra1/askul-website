'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/stats')
}

export async function updateProfile({
  displayName,
  bio,
  institution,
  websiteUrl,
}: {
  displayName: string
  bio: string | null
  institution: string | null
  websiteUrl: string | null
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, bio, institution, website_url: websiteUrl })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidateAll()
  return { error: null }
}

export async function updateAvatarPath(avatarPath: string | null, oldPath: string | null) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase.from('profiles').update({ avatar_url: avatarPath }).eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  if (oldPath) {
    await supabase.storage.from('avatars').remove([oldPath])
  }

  revalidateAll()
  return { error: null }
}