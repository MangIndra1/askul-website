const STAR_POSITIONS = [
  { x: 30, y: 140 },
  { x: 70, y: 85 },
  { x: 120, y: 110 },
  { x: 165, y: 55 },
  { x: 205, y: 90 },
  { x: 245, y: 45 },
  { x: 275, y: 105 },
]

export function ConstellationCard({
  level,
  xpTotal,
  starIndex,
  cycleNumber,
  xpToNextLevel,
}: {
  level: number
  xpTotal: number
  starIndex: number
  cycleNumber: number
  xpToNextLevel: number
}) {
  return (
    <div className="glass mx-auto max-w-md rounded-[28px] p-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-bold text-[var(--dk-text)]">Constellation</p>
          <p className="mt-1 text-xs text-[var(--dk-text-soft)]">
            Level {level} · {xpToNextLevel} XP lagi menuju bintang berikutnya
          </p>
        </div>
        <span className="rounded-full bg-[var(--lav-400)]/[0.15] px-3 py-1 text-[11px] font-semibold text-[var(--lav-400)]">
          Rasi #{cycleNumber}
        </span>
      </div>

      <svg viewBox="0 0 300 160" className="mt-4 w-full">
        <defs>
          <radialGradient id="starFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#c9b6ff" />
            <stop offset="100%" stopColor="#7c5ce6" />
          </radialGradient>
        </defs>

        {STAR_POSITIONS.slice(0, -1).map((pos, i) => {
          const next = STAR_POSITIONS[i + 1]
          const done = i < starIndex
          return (
            <line
              key={i}
              x1={pos.x}
              y1={pos.y}
              x2={next.x}
              y2={next.y}
              stroke={done ? '#a78bfa' : '#6f6390'}
              strokeWidth={done ? 1.5 : 1.2}
              strokeDasharray={done ? undefined : '3 4'}
              opacity={done ? 0.6 : 0.3}
            />
          )
        })}

        {STAR_POSITIONS.map((pos, i) => {
          if (i < starIndex) {
            return (
              <circle
                key={i}
                cx={pos.x}
                cy={pos.y}
                r={5}
                fill="url(#starFill)"
                style={{ filter: 'drop-shadow(0 0 6px rgba(167,139,250,0.8))' }}
              />
            )
          }
          if (i === starIndex) {
            return (
              <circle
                key={i}
                cx={pos.x}
                cy={pos.y}
                r={6.5}
                fill="#ec4899"
                style={{ filter: 'drop-shadow(0 0 10px rgba(236,72,153,0.9))' }}
              />
            )
          }
          return (
            <circle key={i} cx={pos.x} cy={pos.y} r={4} fill="none" stroke="#6f6390" strokeWidth={1.3} />
          )
        })}
      </svg>

      <div className="mt-4 flex justify-between border-t border-white/[0.08] pt-4">
        <div className="flex-1 text-center">
          <p className="bg-gradient-to-br from-[var(--lav-400)] to-[var(--pink-400)] bg-clip-text text-lg font-extrabold text-transparent">
            {level}
          </p>
          <p className="text-[10px] text-[var(--dk-text-faint)]">LEVEL</p>
        </div>
        <div className="flex-1 text-center">
          <p className="bg-gradient-to-br from-[var(--lav-400)] to-[var(--pink-400)] bg-clip-text text-lg font-extrabold text-transparent">
            {xpTotal}
          </p>
          <p className="text-[10px] text-[var(--dk-text-faint)]">TOTAL XP</p>
        </div>
        <div className="flex-1 text-center">
          <p className="bg-gradient-to-br from-[var(--lav-400)] to-[var(--pink-400)] bg-clip-text text-lg font-extrabold text-transparent">
            {xpToNextLevel}
          </p>
          <p className="text-[10px] text-[var(--dk-text-faint)]">XP LAGI</p>
        </div>
      </div>
    </div>
  )
}