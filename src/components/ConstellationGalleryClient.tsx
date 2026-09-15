'use client'

import { useState } from 'react'
import { computeConstellationProgress, type ConstellationProgress } from '@/lib/constellations'

function IconLock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}
function IconSparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2 14 9l7 2-7 2-2 7-2-7-7-2 7-2Z" />
    </svg>
  )
}
function IconX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function ConstellationSVG({ c, size = 130 }: { c: ConstellationProgress; size?: number }) {
  const filterId = `glow-${c.id}`
  const dim = c.status === 'locked'

  return (
    <svg viewBox="0 0 200 150" style={{ height: size }} className="w-full">
      <defs>
        <filter id={filterId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {c.lines.map(([a, b], i) => {
        const bothLit = a < c.lit && b < c.lit
        return (
          <line
            key={i}
            x1={c.stars[a].x}
            y1={c.stars[a].y}
            x2={c.stars[b].x}
            y2={c.stars[b].y}
            stroke={bothLit ? 'var(--lav-400)' : dim ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}
            strokeWidth={bothLit ? 1.3 : 0.7}
          />
        )
      })}

      {c.stars.map((s, i) => {
        const isLit = i < c.lit
        return (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={isLit ? 4.2 : dim ? 1.8 : 2.6}
            fill={isLit ? '#ffffff' : dim ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.25)'}
            filter={isLit ? `url(#${filterId})` : undefined}
          />
        )
      })}
    </svg>
  )
}

export function ConstellationGalleryClient({ xpTotal }: { xpTotal: number }) {
  const constellations = computeConstellationProgress(xpTotal)
  const completedCount = constellations.filter((c) => c.status === 'completed').length
  const [openId, setOpenId] = useState<string | null>(null)
  const openC = constellations.find((c) => c.id === openId) ?? null

  return (
    <div className="flex flex-col gap-5">
      <div className="glass rounded-[28px] p-6">
        <p className="text-[18px] font-bold tracking-[-0.3px] text-[var(--dk-text)]">Peta Rasi Bintang</p>
        <p className="mt-1 text-sm text-[var(--dk-text-faint)]">
          Tiap aktivitas yang kamu selesaikan menyalakan satu bintang di langit ini.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div>
            <p className="text-2xl font-bold text-[var(--lav-400)]">{xpTotal}</p>
            <p className="text-[10px] text-[var(--dk-text-faint)]">Total XP</p>
          </div>
          <div className="h-8 w-px bg-white/[0.08]" />
          <div>
            <p className="text-2xl font-bold text-[var(--dk-text)]">
              {completedCount}/{constellations.length}
            </p>
            <p className="text-[10px] text-[var(--dk-text-faint)]">Rasi selesai</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {constellations.map((c) => {
          const locked = c.status === 'locked'
          return (
            <button
              key={c.id}
              onClick={() => setOpenId(c.id)}
              className={`glass group relative flex flex-col items-center overflow-hidden rounded-[24px] p-5 text-center transition hover:-translate-y-1 ${
                locked ? 'opacity-60' : ''
              }`}
            >
              {c.status === 'completed' && (
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[var(--lav-600)] px-2 py-0.5 text-[9px] font-semibold text-white">
                  <IconSparkle className="h-2.5 w-2.5" /> Selesai
                </span>
              )}
              {locked && (
                <span className="absolute right-3 top-3 text-[var(--dk-text-faint)]">
                  <IconLock className="h-3.5 w-3.5" />
                </span>
              )}

              <ConstellationSVG c={c} />

              <p className={`mt-2 text-sm font-bold ${locked ? 'text-[var(--dk-text-faint)]' : 'text-[var(--dk-text)]'}`}>
                {locked ? '???' : c.name}
              </p>
              <p className="text-xs text-[var(--dk-text-faint)]">
                {locked ? 'Terkunci' : `${c.meaning} · ${c.lit}/${c.stars.length} bintang`}
              </p>
            </button>
          )
        })}
      </div>

      {openC && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setOpenId(null)}
        >
          <div
            className="glass relative w-full max-w-md rounded-[28px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpenId(null)}
              className="absolute right-5 top-5 text-[var(--dk-text-faint)] hover:text-[var(--dk-text)]"
            >
              <IconX className="h-5 w-5" />
            </button>

            <ConstellationSVG c={openC} size={180} />

            <p className="mt-3 text-lg font-bold text-[var(--dk-text)]">
              {openC.status === 'locked' ? '???' : openC.name}
            </p>
            <p className="text-xs text-[var(--dk-text-faint)]">
              {openC.status === 'locked' ? 'Terkunci — terus kumpulin XP buat ngebukanya' : openC.meaning}
            </p>

            <p className="mt-3 text-sm text-[var(--dk-text-soft)]">
              {openC.status === 'locked'
                ? 'Selesaikan rasi sebelumnya buat mulai nyalain bintang di sini.'
                : openC.fact}
            </p>

            {openC.status !== 'locked' && (
              <p className="mt-4 text-xs font-medium text-[var(--lav-400)]">
                {openC.lit}/{openC.stars.length} bintang menyala
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}