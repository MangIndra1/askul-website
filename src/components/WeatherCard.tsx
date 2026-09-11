'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

type WeatherData = {
  currentTemp: number
  currentCode: number
  todayMax: number
  todayMin: number
  location: string
  daily: { date: string; max: number; code: number }[]
}

// File-file ini didownload dari repo resmi microsoft/fluentui-emoji (MIT,
// boleh dipakai komersial) — taruh di public/images/weather/
const WEATHER_ASSET: Record<string, string> = {
  clear: '/images/weather/sun.png',
  partly_cloudy: '/images/weather/partly-cloudy.png',
  cloudy: '/images/weather/cloudy.png',
  fog: '/images/weather/fog.png',
  rain: '/images/weather/rain.png',
  storm: '/images/weather/storm.png',
  snow: '/images/weather/snow.png',
}

function weatherInfo(code: number) {
  if (code === 0) return { label: 'Cerah', key: 'clear' }
  if (code >= 1 && code <= 3) return { label: 'Berawan sebagian', key: 'partly_cloudy' }
  if (code === 45 || code === 48) return { label: 'Berkabut', key: 'fog' }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { label: 'Hujan', key: 'rain' }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: 'Salju', key: 'snow' }
  if (code >= 95) return { label: 'Badai', key: 'storm' }
  return { label: 'Berawan', key: 'cloudy' }
}

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function IconArrowUp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  )
}
function IconArrowDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  )
}

export function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setStatus('error')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords

          const [weatherRes, geoRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5`
            ),
            fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`
            ).catch(() => null),
          ])

          const data = await weatherRes.json()
          let location = ''
          if (geoRes) {
            const geoData = await geoRes.json()
            location = geoData.city || geoData.locality || geoData.principalSubdivision || ''
          }

          setWeather({
            currentTemp: Math.round(data.current.temperature_2m),
            currentCode: data.current.weather_code,
            todayMax: Math.round(data.daily.temperature_2m_max[0]),
            todayMin: Math.round(data.daily.temperature_2m_min[0]),
            location,
            daily: (data.daily.time as string[]).slice(1, 5).map((date, i) => ({
              date,
              max: Math.round(data.daily.temperature_2m_max[i + 1]),
              code: data.daily.weather_code[i + 1],
            })),
          })
          setStatus('ready')
        } catch {
          setStatus('error')
        }
      },
      () => setStatus('error')
    )
  }, [])

  if (status === 'loading') {
    return (
      <div className="glass flex items-center justify-center rounded-[28px] p-8">
        <p className="text-sm text-[var(--dk-text-faint)]">Memuat cuaca...</p>
      </div>
    )
  }

  if (status === 'error' || !weather) {
    return (
      <div className="glass rounded-[28px] p-8">
        <p className="text-[18px] font-bold tracking-[-0.3px] text-[var(--dk-text)]">Cuaca</p>
        <p className="mt-4 text-sm text-[var(--dk-text-faint)]">
          Nggak bisa ambil data cuaca — izin lokasi ditolak atau koneksi bermasalah.
        </p>
      </div>
    )
  }

  const current = weatherInfo(weather.currentCode)

  return (
    <div className="glass flex flex-col items-center rounded-[28px] p-8 text-center">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative h-32 w-32">
          <Image src={WEATHER_ASSET[current.key]} alt={current.label} fill className="object-contain" />
        </div>

        <p className="mt-1 text-7xl font-medium text-[var(--dk-text)]">{weather.currentTemp}°</p>
        <p className="mt-2 text-base text-[var(--dk-text-soft)]">{current.label}</p>
        {weather.location && <p className="mt-0.5 text-sm text-[var(--dk-text-faint)]">{weather.location}</p>}

        <div className="mt-4 flex items-center gap-4 text-sm font-semibold text-[var(--dk-text-soft)]">
          <span className="flex items-center gap-1">
            <IconArrowUp className="h-3.5 w-3.5 text-[var(--lav-400)]" />
            {weather.todayMax}°
          </span>
          <span className="flex items-center gap-1">
            <IconArrowDown className="h-3.5 w-3.5 text-[var(--dk-text-faint)]" />
            {weather.todayMin}°
          </span>
        </div>
      </div>

      <div className="flex w-full justify-center gap-5 border-t border-white/[0.08] pt-5">
        {weather.daily.map((d) => {
          const info = weatherInfo(d.code)
          const day = DAY_LABELS[new Date(d.date).getDay()]
          return (
            <div key={d.date} className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] text-[var(--dk-text-faint)]">{day}</span>
              <div className="relative h-9 w-9">
                <Image src={WEATHER_ASSET[info.key]} alt={info.label} fill className="object-contain" />
              </div>
              <span className="text-xs font-medium text-[var(--dk-text)]">{d.max}°</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}