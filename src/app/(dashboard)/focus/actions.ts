'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function saveFocusSession({
  startedAt,
  durationMinutes,
  techniqueName,
}: {
  startedAt: string
  durationMinutes: number
  techniqueName: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase.from('focus_sessions').insert({
    user_id: user.id,
    started_at: startedAt,
    ended_at: new Date().toISOString(),
    duration_minutes: durationMinutes,
    completed: true,
    technique_name: techniqueName,
  })

  // Catatan: XP otomatis nambah lewat trigger on_focus_session_created
  // yang udah kita buat di Fase 0 — nggak perlu di-handle manual di sini.

  if (error) {
    return { error: error.message }
  }

  // Kasih tau Next.js data Server Component di halaman /focus
  // (riwayat, statistik) perlu di-refresh, soalnya ada row baru.
  revalidatePath('/focus')

  return { error: null }
}