'use client'

import { useState } from 'react'

// Ganti/tambah playlist di sini kapan aja — ambil ID dari link
// "Share > Copy link to playlist" Spotify (bagian setelah /playlist/).
const PLAYLISTS = [
  { id: '37i9dQZF1DWWQRwui0ExPn', name: 'Lofi Beats' },
  { id: '0oPyDVNdgcPFAWmOYSK7O1', name: 'Deep Study' },
  { id: '37i9dQZF1EQoowv2cDraCW', name: 'J-POP Mix' },
  { id: '37i9dQZF1DZ06evO17ZOAt', name: '💙Hearts2Hearts🩵' },
]

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function MusicCard() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [selected, setSelected] = useState(PLAYLISTS[0])

  return (
    <div className="glass flex flex-col rounded-[28px] p-6">
      <div className="flex items-center justify-between">
        <p className="text-[18px] font-bold tracking-[-0.3px] text-[var(--dk-text)]">Music</p>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-[var(--dk-text)] transition hover:bg-white/[0.09]"
          >
            <span>{selected.name}</span>
            <IconChevronDown className="h-3.5 w-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 z-20 w-56 rounded-[18px] border border-white/10 bg-[rgba(23,28,55,0.97)] p-2 text-left shadow-xl backdrop-blur-xl">
              {PLAYLISTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelected(p)
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--dk-text)] transition hover:bg-white/[0.06]"
                >
                  <span className="flex-1">{p.name}</span>
                  {selected.id === p.id && <IconCheck className="h-4 w-4 text-[var(--lav-400)]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

        <div className="mt-4">
            <iframe
                key={selected.id}
                src={`https://open.spotify.com/embed/playlist/${selected.id}?utm_source=generator&theme=0`}
                width="100%"
                height="352"
                style={{
                borderRadius: 16,
                border: 'none',
                }}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
            />
        </div>
    </div>
  )
}