'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signup } from '@/app/auth/actions'
import { createClient as createBrowserClient } from '@/utils/supabase/client'

function IconGoogle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

function SignupForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleGoogleSignup() {
    setGoogleLoading(true)
    const supabase = createBrowserClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="glass w-full max-w-sm rounded-[28px] p-8">
      <h1 className="text-xl font-semibold text-[var(--dk-text)]">Daftar AsKul</h1>
      <p className="mt-1 text-sm text-[var(--dk-text-faint)]">
        Mulai kelola kuliahmu dengan lebih tenang.
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-red-500/15 px-3 py-2 text-xs text-red-300">
          {decodeURIComponent(error)}
        </p>
      )}

      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={googleLoading}
        className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-medium text-[var(--dk-text)] transition hover:bg-white/[0.08] disabled:opacity-50"
      >
        <IconGoogle className="h-4 w-4" />
        {googleLoading ? 'Mengalihkan...' : 'Daftar dengan Google'}
      </button>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] text-[var(--dk-text-faint)]">atau</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form action={signup} className="flex flex-col gap-3">
        <input
          name="displayName"
          type="text"
          required
          placeholder="Nama panggilan"
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-[var(--dk-text)] outline-none placeholder:text-[var(--dk-text-faint)] focus:border-[var(--lav-400)]"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-[var(--dk-text)] outline-none placeholder:text-[var(--dk-text-faint)] focus:border-[var(--lav-400)]"
        />
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Password (minimal 6 karakter)"
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-[var(--dk-text)] outline-none placeholder:text-[var(--dk-text-faint)] focus:border-[var(--lav-400)]"
        />
        <button
          type="submit"
          className="mt-2 rounded-xl bg-gradient-to-br from-[var(--lav-400)] to-[var(--lav-600)] py-2.5 text-sm font-medium text-white shadow-md transition hover:scale-[1.02]"
        >
          Daftar
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-[var(--dk-text-faint)]">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-medium text-[var(--lav-400)]">
          Masuk
        </Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </main>
  )
}