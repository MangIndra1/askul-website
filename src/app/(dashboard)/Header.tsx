'use client'

import { useEffect, useState } from 'react'

function getGreeting(hour: number) {
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function Header({ displayName }: { displayName: string }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 30 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (!now) {
    return <div className="mb-2 h-[64px] sm:h-[76px]" />
  }

  const hh = now.getHours().toString().padStart(2, '0')
  const mm = now.getMinutes().toString().padStart(2, '0')
  const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`

  return (
    // flex-col di layar sempit (dua blok numpuk rapi, sama-sama rata kiri),
    // baru jadi flex-row (rata kiri vs rata kanan) mulai breakpoint sm.
    <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div>
        <h1 className="text-xl font-bold text-[var(--dk-text)] sm:text-2xl lg:text-3xl">
          {getGreeting(now.getHours())},{' '}
          <span className="bg-gradient-to-br from-[var(--lav-400)] to-[var(--pink-400)] bg-clip-text text-transparent">
            {displayName}
          </span>{' '}
          👋
        </h1>
        <p className="mt-1 text-sm text-[var(--dk-text-soft)]">Fokus · Belajar · Berkembang</p>
      </div>

      <div className="text-left sm:text-right">
        <p className="text-2xl font-bold text-[var(--dk-text)] sm:text-3xl lg:text-4xl">
          {hh}:{mm}
        </p>
        <p className="text-xs text-[var(--dk-text-soft)]">{dateStr}</p>
      </div>
    </div>
  )
}