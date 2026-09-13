'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

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