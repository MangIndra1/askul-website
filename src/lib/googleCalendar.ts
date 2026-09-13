import { createClient } from '@/utils/supabase/server'

const WITA_MS = 8 * 60 * 60 * 1000

// Server (Vercel) jalan di runtime UTC, bukan WITA — jadi nggak bisa pakai
// Date object + local getters (.getHours() dkk) buat nentuin "jam berapa
// ini di WITA", soalnya itu bakal ngikutin timezone SERVER, bukan WITA.
// Trik yang aman: geser instant UTC-nya +8 jam secara manual (di level
// milidetik), terus baca pakai getter UTC (.getUTCHours() dkk) — itu
// SELALU reflect angka mentah Date object, independen dari timezone
// runtime manapun yang menjalankannya.
function toWitaParts(isoStr: string) {
  const utcMs = new Date(isoStr).getTime()
  const w = new Date(utcMs + WITA_MS)
  return {
    year: w.getUTCFullYear(),
    month: w.getUTCMonth() + 1,
    day: w.getUTCDate(),
    hours: w.getUTCHours(),
    minutes: w.getUTCMinutes(),
  }
}

function witaDateOnly(isoStr: string): string {
  const p = toWitaParts(isoStr)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

function hasExplicitTimeWita(isoStr: string): boolean {
  const p = toWitaParts(isoStr)
  return !(p.hours === 0 && p.minutes === 0)
}

function addOneDay(dateOnlyStr: string): string {
  const [y, m, d] = dateOnlyStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + 1)
  const yy = date.getUTCFullYear()
  const mm = (date.getUTCMonth() + 1).toString().padStart(2, '0')
  const dd = date.getUTCDate().toString().padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: connection } = await supabase
    .from('google_calendar_connections')
    .select('access_token, refresh_token, token_expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (!connection) return null

  const expiresAt = new Date(connection.token_expires_at).getTime()
  const bufferMs = 5 * 60 * 1000 // refresh 5 menit sebelum bener-bener expired

  if (expiresAt - Date.now() > bufferMs) {
    return connection.access_token
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: connection.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!tokenRes.ok) return null

  const tokenData = await tokenRes.json()
  const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

  await supabase
    .from('google_calendar_connections')
    .update({
      access_token: tokenData.access_token,
      token_expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return tokenData.access_token
}

type TaskForSync = {
  title: string
  category: string | null
  due_date: string | null
  end_date: string | null
  recurrenceFreq?: string | null
  recurrenceInterval?: number
  recurrenceDaysOfWeek?: number[] | null
  recurrenceUntil?: string | null
}

const RRULE_FREQ: Record<string, string> = { daily: 'DAILY', weekly: 'WEEKLY', monthly: 'MONTHLY', yearly: 'YEARLY' }
const RRULE_DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] // 0=Min...6=Sab, sama urutan kayak kita

function buildRRule(
  freq: string,
  interval: number,
  daysOfWeek: number[] | null | undefined,
  until: string | null | undefined
): string {
  const parts = [`FREQ=${RRULE_FREQ[freq]}`]
  if (interval > 1) parts.push(`INTERVAL=${interval}`)
  if (freq === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
    parts.push(`BYDAY=${daysOfWeek.map((d) => RRULE_DAY_CODES[d]).join(',')}`)
  }
  if (until) {
    parts.push(`UNTIL=${until.replace(/-/g, '')}T235959Z`)
  }
  return `RRULE:${parts.join(';')}`
}

function taskToGoogleEventBody(task: TaskForSync) {
  if (!task.due_date) return null

  const summary = task.category ? `[${task.category}] ${task.title}` : task.title
  const isAllDay = !hasExplicitTimeWita(task.due_date)

  const body: Record<string, unknown> = isAllDay
    ? {
        summary,
        start: { date: witaDateOnly(task.due_date) },
        end: { date: addOneDay(task.end_date ? witaDateOnly(task.end_date) : witaDateOnly(task.due_date)) },
      }
    : {
        summary,
        start: { dateTime: task.due_date },
        end: { dateTime: task.end_date ?? task.due_date },
      }

  if (task.recurrenceFreq) {
    body.recurrence = [
      buildRRule(task.recurrenceFreq, task.recurrenceInterval ?? 1, task.recurrenceDaysOfWeek, task.recurrenceUntil),
    ]
  }

  return body
}

export async function hasGoogleConnection(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('google_calendar_connections')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

export async function pushTaskToGoogle(userId: string, task: TaskForSync): Promise<string | null> {
  const accessToken = await getValidAccessToken(userId)
  if (!accessToken) return null

  const body = taskToGoogleEventBody(task)
  if (!body) return null

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) return null
  const data = await res.json()
  return data.id ?? null
}

export async function updateGoogleEvent(userId: string, eventId: string, task: TaskForSync): Promise<boolean> {
  const accessToken = await getValidAccessToken(userId)
  if (!accessToken) return false

  const body = taskToGoogleEventBody(task)
  if (!body) return false

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return res.ok
}

export async function deleteGoogleEvent(userId: string, eventId: string): Promise<boolean> {
  const accessToken = await getValidAccessToken(userId)
  if (!accessToken) return false

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  // 410 Gone artinya event-nya udah kehapus duluan di sisi Google —
  // dianggap sukses, bukan error.
  return res.ok || res.status === 410
}

export type PulledGoogleEvent = {
  id: string
  recurringEventId: string | null
  title: string
  start: string | null
  end: string | null
  isAllDay: boolean
}

// Ambil event dari Google Calendar dalam rentang [timeMin, timeMax].
// singleEvents=true bikin Google OTOMATIS meng-expand event berulang
// jadi kemunculan per-tanggal buat kita — nggak perlu parser RRULE sendiri.
export async function fetchGoogleEvents(userId: string, timeMin: string, timeMax: string): Promise<PulledGoogleEvent[]> {
  const accessToken = await getValidAccessToken(userId)
  if (!accessToken) return []

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) return []

  const data = await res.json()
  const items = (data.items ?? []) as Array<{
    id: string
    recurringEventId?: string
    summary?: string
    start?: { date?: string; dateTime?: string }
    end?: { date?: string; dateTime?: string }
    status?: string
  }>

  return items
    .filter((item) => item.status !== 'cancelled')
    .map((item) => ({
      id: item.id,
      recurringEventId: item.recurringEventId ?? null,
      title: item.summary ?? '(Tanpa judul)',
      start: item.start?.dateTime ?? item.start?.date ?? null,
      end: item.end?.dateTime ?? item.end?.date ?? null,
      isAllDay: !item.start?.dateTime,
    }))
}