'use client'

import { useState } from 'react'

// Ganti/tambah playlist YouTube di sini kapan aja — ambil ID dari URL
// (bagian setelah list=, sebelum tanda &).
const PLAYLISTS = [
  { id: 'PLnuP9ZD9feDGtrZemSrtONYp4uj9hzRfd', name: 'Annyeong Yeorobun', count: 11 },
  { id: 'PLnuP9ZD9feDFDafHTvn5lZAIMjW_gyV_P', name: "Well well well 90's", count: 21 },
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
function IconExternalLink({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6M10 14 21 3" />
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

      <div className="relative mt-4 w-full overflow-hidden rounded-2xl" style={{ paddingBottom: '56.25%' }}>
        <iframe
          key={selected.id}
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/videoseries?list=${selected.id}`}
          style={{ border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[var(--dk-text)]">{selected.name}</p>
          <p className="text-xs text-[var(--dk-text-faint)]">{selected.count} video dalam playlist ini</p>
        </div>
        <a
          href={`https://youtube.com/playlist?list=${selected.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-[var(--dk-text-soft)] transition hover:bg-white/[0.1] hover:text-[var(--dk-text)]"
        >
          Buka di YouTube
          <IconExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  )
}