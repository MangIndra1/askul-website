export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="glass w-full max-w-sm rounded-[28px] p-8 text-center">
        <h1 className="text-xl font-semibold text-[var(--ink)]">Cek email kamu</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Kami sudah kirim link konfirmasi. Klik link itu buat aktifin akunmu, baru bisa login.
        </p>
      </div>
    </main>
  )
}