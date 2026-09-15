import { createClient } from '@/utils/supabase/server'
import { ConstellationGalleryClient } from '@/components/ConstellationGalleryClient'

export default async function ConstellationPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp_total')
    .eq('id', user!.id)
    .single()

  return <ConstellationGalleryClient xpTotal={profile?.xp_total ?? 0} />
}