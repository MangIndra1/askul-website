import { createClient } from '@/utils/supabase/server'
import { JournalPageClient } from '@/components/JournalPageClient'

export default async function JournalPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id, content, mood, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return <JournalPageClient entries={entries ?? []} />
}