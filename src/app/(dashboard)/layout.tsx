import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { FocusTimerProvider } from '@/context/FocusTimerContext'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('focus_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('completed', true)
    .gte('started_at', startOfToday.toISOString())

  return (
    <FocusTimerProvider initialSessionsToday={count ?? 0}>
      <div className="flex h-screen w-full flex-col overflow-hidden p-4 sm:p-5 lg:p-6">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-1 flex-col gap-5 overflow-hidden lg:flex-row">
          <Sidebar profile={profile} />
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </FocusTimerProvider>
  )
}