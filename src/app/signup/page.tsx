'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signup } from '@/app/auth/actions'

function SignupForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="glass w-full max-w-sm rounded-[28px] p-8">
      <h1 className="text-xl font-semibold text-[var(--ink)]">Daftar AsKul</h1>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Mulai kelola kuliahmu dengan lebih tenang.
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-[var(--pink)]/40 px-3 py-2 text-xs text-[var(--ink)]">
          {decodeURIComponent(error)}
        </p>
      )}

      <form action={signup} className="mt-6 flex flex-col gap-3">
        <input
          name="displayName"
          type="text"
          required
          placeholder="Nama panggilan"
          className="rounded-xl border border-white/70 bg-white/60 px-4 py-2.5 text-sm outline-none focus:border-[var(--lav-400)]"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="rounded-xl border border-white/70 bg-white/60 px-4 py-2.5 text-sm outline-none focus:border-[var(--lav-400)]"
        />
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Password (minimal 6 karakter)"
          className="rounded-xl border border-white/70 bg-white/60 px-4 py-2.5 text-sm outline-none focus:border-[var(--lav-400)]"
        />
        <button
          type="submit"
          className="mt-2 rounded-xl bg-gradient-to-br from-[var(--lav-400)] to-[var(--lav-600)] py-2.5 text-sm font-medium text-white shadow-md transition hover:scale-[1.02]"
        >
          Daftar
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-[var(--ink-soft)]">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-medium text-[var(--lav-600)]">
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