type SessionRow = {
  id: string
  started_at: string
  duration_minutes: number
  technique_name: string | null
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export function TodaySessionsList({ sessions }: { sessions: SessionRow[] }) {
  return (
    <div className="glass flex flex-1 flex-col rounded-[28px] p-6">
      <p className="font-semibold text-[var(--ink)]">Sesi hari ini</p>

      {sessions.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--ink-soft)]">
          Belum ada sesi fokus hari ini. Mulai satu dari timer di samping.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-white/45 p-3">
              <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--lav-100)] to-white text-xs font-semibold text-[var(--lav-600)]">
                {formatTime(s.started_at)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--ink)]">
                  {s.technique_name ?? 'Sesi fokus'}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-[var(--lav-600)]">
                {s.duration_minutes}m
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}