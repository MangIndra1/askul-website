function IconFlame({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1-.5-2-1-3 1 0 2 1 2 3a7 7 0 1 1-14 0c0-4 3-5 3-9 1 1 2 1 4 2Z" />
    </svg>
  )
}

const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

export function FocusStreakCard({ streak }: { streak: number }) {
  const caption =
    streak === 0
      ? 'Mulai sesi hari ini buat mulai streak'
      : streak === 1
        ? 'Baru dimulai — semangat!'
        : 'Terus pertahankan!'

  // 7 lingkaran gaya Duolingo: mundur dari hari ini 6 hari. Streak berarti
  // hari-hari BERUNTUN tanpa putus, jadi "menyala"-nya cukup diturunin dari
  // angka streak-nya sendiri — kalau streak 3, 3 hari terakhir (termasuk
  // hari ini) menyala, sisanya belum.
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const daysAgo = 6 - i
    const d = new Date(today)
    d.setDate(d.getDate() - daysAgo)
    const jsDay = d.getDay()
    const labelIdx = jsDay === 0 ? 6 : jsDay - 1
    return { lit: daysAgo < streak, label: DAY_LABELS[labelIdx] }
  })

  return (
    <div className="glass rounded-[28px] p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--status-orange)] to-[#c9701f] text-white">
          <IconFlame className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--dk-text)]">Focus streak</p>
          <p className="mt-0.5 truncate text-xs text-[var(--dk-text-faint)]">{caption}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="bg-gradient-to-br from-[var(--status-orange)] to-[#ffcb8a] bg-clip-text text-4xl font-extrabold leading-none text-transparent">
            {streak}
          </p>
          <p className="mt-1 text-[10px] font-medium text-[var(--dk-text-faint)]">hari</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-1.5 border-t border-white/[0.08] pt-4">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                d.lit ? 'bg-gradient-to-br from-[var(--status-orange)] to-[#c9701f]' : 'bg-white/[0.06]'
              }`}
            >
              {d.lit && <IconFlame className="h-4 w-4 text-white" />}
            </div>
            <span className="text-[9px] font-medium text-[var(--dk-text-faint)]">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}