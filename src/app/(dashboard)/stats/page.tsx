import { createClient } from '@/utils/supabase/server'
import { StatsPageClient } from '@/components/StatsPageClient'

export default async function StatsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user!.id

  const now = new Date()
  const yearStart = new Date(now)
  yearStart.setDate(yearStart.getDate() - 375)
  const moodStart = new Date(now)
  moodStart.setDate(moodStart.getDate() - 30)

  const [
    { data: profile },
    { count: tasksCompletedCount },
    { data: allFocusSessions },
    { data: yearTasks },
    { data: yearFocus },
    { data: yearJournal },
    { data: categoryTasks },
    { data: categories },
    { data: moodEntries },
  ] = await Promise.all([
    supabase.from('profiles').select('display_name, bio, institution, website_url, avatar_url, xp_total').eq('id', userId).single(),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true),
    supabase.from('focus_sessions').select('duration_minutes').eq('user_id', userId),
    supabase
      .from('tasks')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('completed_at', yearStart.toISOString()),
    supabase
      .from('focus_sessions')
      .select('started_at, duration_minutes')
      .eq('user_id', userId)
      .gte('started_at', yearStart.toISOString()),
    supabase.from('journal_entries').select('created_at').eq('user_id', userId).gte('created_at', yearStart.toISOString()),
    supabase.from('tasks').select('category').eq('user_id', userId).eq('completed', true).not('category', 'is', null),
    supabase.from('task_categories').select('id, name, color').eq('user_id', userId),
    supabase.from('journal_entries').select('mood').eq('user_id', userId).gte('created_at', moodStart.toISOString()),
  ])

  const totalFocusMinutes = (allFocusSessions ?? []).reduce((sum, s) => sum + s.duration_minutes, 0)

  let avatarSignedUrl: string | null = null
  if (profile?.avatar_url) {
    const { data } = await supabase.storage.from('avatars').createSignedUrl(profile.avatar_url, 3600)
    avatarSignedUrl = data?.signedUrl ?? null
  }

  return (
    <StatsPageClient
      displayName={profile?.display_name ?? 'kamu'}
      bio={profile?.bio ?? null}
      institution={profile?.institution ?? null}
      websiteUrl={profile?.website_url ?? null}
      avatarPath={profile?.avatar_url ?? null}
      avatarUrl={avatarSignedUrl}
      userId={userId}
      xpTotal={profile?.xp_total ?? 0}
      tasksCompletedCount={tasksCompletedCount ?? 0}
      totalFocusMinutes={totalFocusMinutes}
      yearTasks={yearTasks ?? []}
      yearFocus={yearFocus ?? []}
      yearJournal={yearJournal ?? []}
      categoryTasks={categoryTasks ?? []}
      categories={categories ?? []}
      moodEntries={moodEntries ?? []}
    />
  )
}