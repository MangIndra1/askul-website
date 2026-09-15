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
  // Terbaru dulu — dijamin di sini sendiri, nggak gantungan sama urutan
  // yang kebetulan dikasih dari query di luar.
  const sorted = [...sessions].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())

  return (
    <div className="glass flex flex-1 flex-col rounded-[28px] p-6">
      <p className="font-semibold text-[var(--dk-text)]">Sesi hari ini</p>

      {sorted.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--dk-text-soft)]">
          Belum ada sesi fokus hari ini. Mulai satu dari timer di samping.
        </p>
      ) : (
        // Dibatasi ~3.5 baris kelihatan, sisanya scroll — kartu nggak lagi
        // mulur ngikutin jumlah sesi.
        <div className="mt-4 flex max-h-[258px] flex-col gap-2 overflow-y-auto pr-1">
          {sorted.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.05] p-3">
              <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-xs font-semibold text-[var(--lav-400)]">
                {formatTime(s.started_at)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--dk-text)]">
                  {s.technique_name ?? 'Sesi fokus'}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-[var(--lav-400)]">
                {s.duration_minutes}m
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}