function formatHoursMinutes(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  return `${h}j ${m}m`
}

export function PersonalRecordsCard({
  totalMinutes,
  longestSession,
  bestDayMinutes,
}: {
  totalMinutes: number
  longestSession: number
  bestDayMinutes: number
}) {
  const stats = [
    { label: 'Total fokus', value: formatHoursMinutes(totalMinutes) },
    { label: 'Sesi terpanjang', value: `${longestSession}m` },
    { label: 'Hari terbaik', value: formatHoursMinutes(bestDayMinutes) },
  ]

  return (
    <div className="glass rounded-[28px] p-6">
      <p className="font-semibold text-[var(--ink)]">Rekor pribadi</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white/45 p-3 text-center">
            <p className="text-lg font-bold text-[var(--lav-600)]">{s.value}</p>
            <p className="mt-1 text-[10px] leading-tight text-[var(--ink-soft)]">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}