'use client'

import { Fragment } from 'react'
import { ProfileCard } from '@/components/ProfileCard'
import { computeConstellationProgress } from '@/lib/constellations'
import { MOODS } from '@/lib/moods'

type TaskDateRow = { completed_at: string | null }
type FocusDateRow = { started_at: string; duration_minutes: number }
type JournalDateRow = { created_at: string }
type CategoryRow = { category: string | null }
type CategoryDef = { id: string; name: string; color: string }
type MoodRow = { mood: string | null }

function toDateKey(d: Date) {
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatHoursMinutes(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  return `${h}j ${m}m`
}

function startOfWeek(d: Date) {
  const dow = (d.getDay() + 6) % 7 // 0 = Senin
  const s = new Date(d)
  s.setDate(s.getDate() - dow)
  s.setHours(0, 0, 0, 0)
  return s
}

function heatColor(count: number) {
  if (count === 0) return 'rgba(255,255,255,0.05)'
  if (count === 1) return 'rgba(139,77,235,0.35)'
  if (count === 2) return 'rgba(139,77,235,0.6)'
  if (count === 3) return 'rgba(139,77,235,0.85)'
  return 'var(--lav-400)'
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
function IconZap({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
    </svg>
  )
}
function IconBook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  )
}

const TREND_WEEKS = 12
const HEATMAP_DAYS_BACK = 370

export function StatsPageClient({
  displayName,
  bio,
  institution,
  websiteUrl,
  avatarPath,
  avatarUrl,
  userId,
  xpTotal,
  tasksCompletedCount,
  totalFocusMinutes,
  yearTasks,
  yearFocus,
  yearJournal,
  categoryTasks,
  categories,
  moodEntries,
}: {
  displayName: string
  bio: string | null
  institution: string | null
  websiteUrl: string | null
  avatarPath: string | null
  avatarUrl: string | null
  userId: string
  xpTotal: number
  tasksCompletedCount: number
  totalFocusMinutes: number
  yearTasks: TaskDateRow[]
  yearFocus: FocusDateRow[]
  yearJournal: JournalDateRow[]
  categoryTasks: CategoryRow[]
  categories: CategoryDef[]
  moodEntries: MoodRow[]
}) {
  const constellations = computeConstellationProgress(xpTotal)
  const completedConstellations = constellations.filter((c) => c.status === 'completed').length

  // --- Heatmap aktivitas gaya GitHub (setahun penuh, minggu mulai Minggu) ---
  const activityByDate = new Map<string, number>()
  for (const t of yearTasks) {
    if (!t.completed_at) continue
    const key = toDateKey(new Date(t.completed_at))
    activityByDate.set(key, (activityByDate.get(key) ?? 0) + 1)
  }
  for (const f of yearFocus) {
    const key = toDateKey(new Date(f.started_at))
    activityByDate.set(key, (activityByDate.get(key) ?? 0) + 1)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const rawStart = new Date(today)
  rawStart.setDate(rawStart.getDate() - HEATMAP_DAYS_BACK)
  const gridStart = new Date(rawStart)
  gridStart.setDate(gridStart.getDate() - gridStart.getDay()) // mundur ke hari Minggu

  const numWeeks = Math.ceil((today.getTime() - gridStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
  const heatmapWeeks: { date: Date; count: number; future: boolean }[][] = []
  const cursor = new Date(gridStart)
  for (let w = 0; w < numWeeks; w++) {
    const week: { date: Date; count: number; future: boolean }[] = []
    for (let d = 0; d < 7; d++) {
      const key = toDateKey(cursor)
      week.push({ date: new Date(cursor), count: activityByDate.get(key) ?? 0, future: cursor > today })
      cursor.setDate(cursor.getDate() + 1)
    }
    heatmapWeeks.push(week)
  }

  const totalActivityCount = [...activityByDate.values()].reduce((a, b) => a + b, 0)

  const monthLabels: { weekIndex: number; label: string }[] = []
  let lastMonth = -1
  heatmapWeeks.forEach((week, wi) => {
    const m = week[0].date.getMonth()
    if (m !== lastMonth) {
      monthLabels.push({ weekIndex: wi, label: week[0].date.toLocaleDateString('id-ID', { month: 'short' }) })
      lastMonth = m
    }
  })

  const DAY_ROW_LABELS = ['', 'Sen', '', 'Rab', '', 'Jum', '']

  // --- Feed Aktivitas, dikelompokkan per bulan ---
  type MonthBucket = { key: string; label: string; tasksCount: number; focusCount: number; focusMinutes: number; journalCount: number }
  const buckets = new Map<string, MonthBucket>()
  function getBucket(d: Date) {
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        tasksCount: 0,
        focusCount: 0,
        focusMinutes: 0,
        journalCount: 0,
      })
    }
    return buckets.get(key)!
  }
  for (const t of yearTasks) {
    if (!t.completed_at) continue
    getBucket(new Date(t.completed_at)).tasksCount++
  }
  for (const f of yearFocus) {
    const b = getBucket(new Date(f.started_at))
    b.focusCount++
    b.focusMinutes += f.duration_minutes
  }
  for (const j of yearJournal) {
    getBucket(new Date(j.created_at)).journalCount++
  }
  const activityFeed = [...buckets.values()].sort((a, b) => b.key.localeCompare(a.key)).slice(0, 6)

  // --- Task per kategori ---
  const categoryCounts = new Map<string, number>()
  for (const t of categoryTasks) {
    if (!t.category) continue
    categoryCounts.set(t.category, (categoryCounts.get(t.category) ?? 0) + 1)
  }
  const categoryBreakdown = categories
    .map((c) => ({ name: c.name, color: c.color, count: categoryCounts.get(c.name) ?? 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
  const maxCategoryCount = Math.max(...categoryBreakdown.map((c) => c.count), 1)

  // --- Tren fokus mingguan (12 minggu) ---
  const thisWeekStart = startOfWeek(today)
  const weekBuckets: number[] = Array(TREND_WEEKS).fill(0)
  for (const s of yearFocus) {
    const wStart = startOfWeek(new Date(s.started_at))
    const diffWeeks = Math.round((thisWeekStart.getTime() - wStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
    const idx = TREND_WEEKS - 1 - diffWeeks
    if (idx >= 0 && idx < TREND_WEEKS) weekBuckets[idx] += s.duration_minutes
  }
  const maxWeekMinutes = Math.max(...weekBuckets, 1)

  // --- Ringkasan mood (30 hari terakhir) ---
  const moodCounts = new Map<string, number>()
  for (const e of moodEntries) {
    if (!e.mood) continue
    moodCounts.set(e.mood, (moodCounts.get(e.mood) ?? 0) + 1)
  }
  const totalMoodEntries = moodEntries.filter((e) => e.mood).length
  const moodBreakdown = MOODS.map((m) => ({ ...m, count: moodCounts.get(m.value) ?? 0 }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count)

  return (
    <div className="flex flex-col gap-5">
      <ProfileCard
        displayName={displayName}
        bio={bio}
        institution={institution}
        websiteUrl={websiteUrl}
        avatarPath={avatarPath}
        avatarUrl={avatarUrl}
        userId={userId}
        stats={{
          tasksCompleted: tasksCompletedCount,
          focusLabel: formatHoursMinutes(totalFocusMinutes),
          constellationsDone: `${completedConstellations}/${constellations.length}`,
        }}
      />

      {/* Heatmap gaya GitHub */}
      <div className="glass rounded-[28px] p-6">
        <p className="font-semibold text-[var(--dk-text)]">{totalActivityCount} aktivitas dalam setahun terakhir</p>

        <div className="mt-4 overflow-x-auto pb-2">
          <div className="min-w-[640px]" suppressHydrationWarning>
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `28px repeat(${heatmapWeeks.length}, minmax(0, 1fr))` }}
            >
              <div />
              {heatmapWeeks.map((_, wi) => {
                const label = monthLabels.find((m) => m.weekIndex === wi)?.label
                return (
                  <div key={`m-${wi}`} className="text-[9px] text-[var(--dk-text-faint)]">
                    {label ?? ''}
                  </div>
                )
              })}

              {DAY_ROW_LABELS.map((dayLabel, di) => (
                <Fragment key={`row-${di}`}>
                  <div className="flex items-center text-[9px] leading-none text-[var(--dk-text-faint)]">{dayLabel}</div>
                  {heatmapWeeks.map((week, wi) => {
                    const day = week[di]
                    return (
                      <div
                        key={`${wi}-${di}`}
                        title={day.future ? undefined : `${day.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}: ${day.count} aktivitas`}
                        className="aspect-square rounded-sm"
                        style={{ backgroundColor: day.future ? 'transparent' : heatColor(day.count) }}
                      />
                    )
                  })}
                </Fragment>
              ))}
            </div>

            <div className="mt-2 flex items-center justify-end gap-1.5 text-[9px] text-[var(--dk-text-faint)]">
              <span>Sedikit</span>
              {[0, 1, 2, 3, 4].map((lvl) => (
                <div key={lvl} className="h-3 w-3 rounded-sm" style={{ backgroundColor: heatColor(lvl) }} />
              ))}
              <span>Banyak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Aktivitas per bulan */}
      <div className="glass rounded-[28px] p-6">
        <p className="font-semibold text-[var(--dk-text)]">Aktivitas</p>
        {activityFeed.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--dk-text-faint)]">Belum ada aktivitas tercatat.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-5">
            {activityFeed.map((b) => (
              <div key={b.key}>
                <p className="text-xs font-semibold capitalize text-[var(--dk-text-faint)]">{b.label}</p>
                <div className="mt-2 flex flex-col gap-2">
                  {b.tasksCount > 0 && (
                    <div className="flex items-center gap-2 text-sm text-[var(--dk-text-soft)]">
                      <IconCheck className="h-4 w-4 text-[var(--lav-400)]" />
                      Menyelesaikan <span className="font-semibold text-[var(--dk-text)]">{b.tasksCount} task</span>
                    </div>
                  )}
                  {b.focusCount > 0 && (
                    <div className="flex items-center gap-2 text-sm text-[var(--dk-text-soft)]">
                      <IconZap className="h-4 w-4 text-[var(--pink-400)]" />
                      <span className="font-semibold text-[var(--dk-text)]">{b.focusCount} sesi fokus</span> ({formatHoursMinutes(b.focusMinutes)})
                    </div>
                  )}
                  {b.journalCount > 0 && (
                    <div className="flex items-center gap-2 text-sm text-[var(--dk-text-soft)]">
                      <IconBook className="h-4 w-4 text-[var(--status-orange)]" />
                      Menulis <span className="font-semibold text-[var(--dk-text)]">{b.journalCount} halaman jurnal</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="glass rounded-[28px] p-6">
          <p className="font-semibold text-[var(--dk-text)]">Task per Kategori</p>
          {categoryBreakdown.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--dk-text-faint)]">Belum ada task selesai yang berkategori.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {categoryBreakdown.map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--dk-text-soft)]">{c.name}</span>
                    <span className="text-[var(--dk-text-faint)]">{c.count}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full" style={{ width: `${(c.count / maxCategoryCount) * 100}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-[28px] p-6">
          <p className="font-semibold text-[var(--dk-text)]">Ringkasan Mood</p>
          <p className="mt-1 text-xs text-[var(--dk-text-faint)]">30 hari terakhir, dari catatan Journal</p>
          {moodBreakdown.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--dk-text-faint)]">Belum ada catatan mood dalam 30 hari terakhir.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {moodBreakdown.map((m) => (
                <div key={m.value}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--dk-text-soft)]">{m.emoji} {m.label}</span>
                    <span className="text-[var(--dk-text-faint)]">{m.count}/{totalMoodEntries}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full" style={{ width: `${(m.count / totalMoodEntries) * 100}%`, backgroundColor: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-[28px] p-6">
        <p className="font-semibold text-[var(--dk-text)]">Tren Fokus Mingguan</p>
        <p className="mt-1 text-xs text-[var(--dk-text-faint)]">{TREND_WEEKS} minggu terakhir</p>
        <div className="mt-6 flex items-end justify-between gap-1.5">
          {weekBuckets.map((m, i) => {
            const heightPct = Math.max((m / maxWeekMinutes) * 100, 3)
            const isThisWeek = i === TREND_WEEKS - 1
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-[90px] w-full items-end">
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${heightPct}%`,
                      background: isThisWeek
                        ? 'linear-gradient(to top, var(--lav-600), var(--pink-400))'
                        : 'linear-gradient(to top, rgba(107,73,209,0.4), rgba(139,77,235,0.4))',
                    }}
                    title={`${m} menit`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}