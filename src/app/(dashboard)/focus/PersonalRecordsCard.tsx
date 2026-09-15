function IconFlame({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1-.5-2-1-3 2 1 3 3 3 6a6 6 0 0 1-12 0c0-4 2-5 4-10Z" />
    </svg>
  )
}
function IconZap({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
    </svg>
  )
}
function IconStar({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
    </svg>
  )
}

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
    { label: 'Total fokus', sub: 'sepanjang waktu', value: formatHoursMinutes(totalMinutes), Icon: IconFlame, color: 'var(--pink-400)' },
    { label: 'Sesi terlama', sub: 'dalam 1x duduk', value: `${longestSession}m`, Icon: IconZap, color: 'var(--status-orange)' },
    { label: 'Hari terbaik', sub: 'total dalam 1 hari', value: formatHoursMinutes(bestDayMinutes), Icon: IconStar, color: 'var(--lav-400)' },
  ]

  return (
    <div className="glass rounded-[28px] p-6">
      <p className="font-semibold text-[var(--dk-text)]">Rekor pribadi</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/[0.05] p-3 text-center">
            <s.Icon className="h-4 w-4" style={{ color: s.color }} />
            <p className="text-lg font-bold text-[var(--dk-text)]">{s.value}</p>
            <div>
              <p className="text-[10px] font-medium leading-tight text-[var(--dk-text-soft)]">{s.label}</p>
              <p className="text-[9px] leading-tight text-[var(--dk-text-faint)]">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}