import { createClient } from '@/utils/supabase/server'

const WITA_OFFSET = '+08:00'

// Ambil jam-menit LANGSUNG dari string (posisi karakter), BUKAN lewat
// Date object — soalnya runtime server (Vercel) defaultnya zona UTC,
// bukan WITA, jadi .getHours() dari Date object bisa salah di server
// walau kodenya sama persis kayak yang jalan benar di browser.
function hasExplicitTime(dateStr: string): boolean {
  const hh = dateStr.slice(11, 13)
  const mm = dateStr.slice(14, 16)
  return !(hh === '00' && mm === '00')
}

function toDateOnly(dateStr: string): string {
  return dateStr.slice(0, 10)
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

// Ambil 19 karakter pertama (YYYY-MM-DDTHH:mm:ss) apa adanya, tempelin
// offset WITA eksplisit — sekali lagi, nggak lewat Date object sama
// sekali, biar hasil akhirnya nggak tersandung timezone runtime server.
function toWitaDateTime(dateStr: string): string {
  return `${dateStr.slice(0, 19)}${WITA_OFFSET}`
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
}

function taskToGoogleEventBody(task: TaskForSync) {
  if (!task.due_date) return null

  const summary = task.category ? `[${task.category}] ${task.title}` : task.title
  const isAllDay = !hasExplicitTime(task.due_date)

  if (isAllDay) {
    // Task tanpa jam spesifik ATAU acara multi-hari -> event "sepanjang
    // hari" di Google. Catatan: field end.date Google itu EKSKLUSIF
    // (hari SETELAH hari terakhir), makanya perlu addOneDay.
    const startDate = toDateOnly(task.due_date)
    const endDate = task.end_date ? toDateOnly(task.end_date) : startDate
    return {
      summary,
      start: { date: startDate },
      end: { date: addOneDay(endDate) },
    }
  }

  return {
    summary,
    start: { dateTime: toWitaDateTime(task.due_date) },
    end: { dateTime: toWitaDateTime(task.end_date ?? task.due_date) },
  }
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