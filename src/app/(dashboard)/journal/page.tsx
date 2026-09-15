import { createClient } from '@/utils/supabase/server'
import { JournalPageClient } from '@/components/JournalPageClient'

export default async function JournalPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user!.id)
    .single()

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id, content, mood, photo_path, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  // Bucket-nya privat — nggak ada URL publik yang langsung bisa diakses,
  // jadi generate signed URL (berlaku 1 jam) buat tiap foto yang ada.
  const entriesWithPhotoUrl = await Promise.all(
    (entries ?? []).map(async (e) => {
      if (!e.photo_path) return { ...e, photo_url: null as string | null }
      const { data } = await supabase.storage.from('journal-photos').createSignedUrl(e.photo_path, 3600)
      return { ...e, photo_url: data?.signedUrl ?? null }
    })
  )

  return (
    <JournalPageClient
      entries={entriesWithPhotoUrl}
      displayName={profile?.display_name ?? 'kamu'}
      userId={user!.id}
    />
  )
}