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

  return (
    <div className="glass rounded-[28px] p-6">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-[var(--ink)]">Statistik minggu ini</p>
        <span className="text-xs font-medium text-[var(--ink-soft)]">
          {totalSessions} sesi · {totalMinutes} menit
        </span>
      </div>

      <div className="mt-6 flex items-end justify-between gap-2">
        {totals.map((m, i) => {
          const heightPct = Math.max((m / max) * 100, 4)
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-[100px] w-full items-end">
                <div
                  className="w-full rounded-full bg-gradient-to-t from-[var(--lav-400)] to-[var(--lav-600)]"
                  style={{ height: `${heightPct}%` }}
                  title={`${m} menit`}
                />
              </div>
              <span className="text-[10px] font-medium text-[var(--ink-soft)]">{DAY_LABELS[i]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}