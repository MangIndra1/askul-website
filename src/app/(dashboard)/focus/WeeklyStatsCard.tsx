type SessionRow = {
  started_at: string
  duration_minutes: number
}

const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

export function WeeklyStatsCard({ sessions }: { sessions: SessionRow[] }) {
  const totals = [0, 0, 0, 0, 0, 0, 0] // index 0 = Senin ... 6 = Minggu

  for (const s of sessions) {
    const d = new Date(s.started_at)
    const jsDay = d.getDay() // 0 = Minggu .. 6 = Sabtu
    const idx = jsDay === 0 ? 6 : jsDay - 1
    totals[idx] += s.duration_minutes
  }

  const totalMinutes = totals.reduce((a, b) => a + b, 0)
  const totalSessions = sessions.length
  const max = Math.max(...totals, 1)

  const today = new Date()
  const todayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1

  return (
    <div className="glass rounded-[28px] p-6">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-[var(--dk-text)]">Statistik minggu ini</p>
        <span className="text-xs font-medium text-[var(--dk-text-faint)]">
          {totalSessions} sesi · {totalMinutes} menit
        </span>
      </div>

      <div className="mt-6 flex items-end justify-between gap-2">
        {totals.map((m, i) => {
          const heightPct = Math.max((m / max) * 100, 4)
          const isToday = i === todayIdx
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-[100px] w-full items-end">
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${heightPct}%`,
                    background: isToday
                      ? 'linear-gradient(to top, var(--lav-600), var(--pink-400))'
                      : 'linear-gradient(to top, rgba(107,73,209,0.4), rgba(139,77,235,0.4))',
                  }}
                  title={`${DAY_LABELS[i]}: ${m} menit`}
                />
              </div>
              <span className={`text-[10px] font-medium ${isToday ? 'text-[var(--lav-400)]' : 'text-[var(--dk-text-faint)]'}`}>
                {DAY_LABELS[i]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}