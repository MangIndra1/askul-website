import { createClient } from '@/utils/supabase/server'
import { ConstellationCard } from './ConstellationCard' 

const STARS_PER_CYCLE = 7

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

  const xpTotal = profile?.xp_total ?? 0
  const level = Math.floor(xpTotal / 100) + 1
  const starIndex = (level - 1) % STARS_PER_CYCLE
  const cycleNumber = Math.floor((level - 1) / STARS_PER_CYCLE) + 1
  const xpIntoLevel = xpTotal % 100
  const xpToNextLevel = 100 - xpIntoLevel

  return (
    <ConstellationCard
      level={level}
      xpTotal={xpTotal}
      starIndex={starIndex}
      cycleNumber={cycleNumber}
      xpToNextLevel={xpToNextLevel}
    />
  )
}