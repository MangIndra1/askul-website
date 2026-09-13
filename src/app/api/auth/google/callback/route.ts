import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/calendar?google_error=missing_code', request.url))
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokenData = await tokenRes.json()

  if (!tokenRes.ok || !tokenData.refresh_token) {
    // Kalau refresh_token nggak ada, kemungkinan besar user udah pernah
    // authorize sebelumnya dan Google nggak ngirim ulang. Karena kita
    // pakai prompt=consent di authorization URL, ini seharusnya jarang
    // kejadian, tapi tetap kita tangani biar nggak nyimpen data rusak.
    return NextResponse.redirect(new URL('/calendar?google_error=token_exchange_failed', request.url))
  }

  const { access_token, refresh_token, expires_in } = tokenData

  // Ambil email akun Google yang barusan authorize — butuh scope
  // userinfo.email (udah ditambahin di authorization URL).
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  const userInfo = await userInfoRes.json().catch(() => ({}))
  const googleEmail: string | null = userInfo.email ?? null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

  const { error } = await supabase.from('google_calendar_connections').upsert(
    {
      user_id: user.id,
      access_token,
      refresh_token,
      google_email: googleEmail,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    return NextResponse.redirect(new URL('/calendar?google_error=save_failed', request.url))
  }

  return NextResponse.redirect(new URL('/calendar?google_connected=1', request.url))
}