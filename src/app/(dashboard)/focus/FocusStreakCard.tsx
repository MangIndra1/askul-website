function IconFlame({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1-.5-2-1-3 1 0 2 1 2 3a7 7 0 1 1-14 0c0-4 3-5 3-9 1 1 2 1 4 2Z" />
    </svg>
  )
}

export function FocusStreakCard({ streak }: { streak: number }) {
  const caption =
    streak === 0
      ? 'Mulai sesi hari ini buat mulai streak'
      : streak === 1
        ? 'Baru dimulai — semangat!'
        : 'Terus pertahankan!'

  return (
    <div className="glass flex items-center gap-4 rounded-[28px] p-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--peach)] to-[var(--peach-deep)] text-white">
        <IconFlame className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--ink)]">Focus streak</p>
        <p className="mt-0.5 truncate text-xs text-[var(--ink-soft)]">{caption}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className="bg-gradient-to-br from-[var(--peach-deep)] to-[var(--lav-600)] bg-clip-text text-4xl font-extrabold leading-none text-transparent">
          {streak}
        </p>
        <p className="mt-1 text-[10px] font-medium text-[var(--ink-soft)]">hari</p>
      </div>
    </div>
  )
}