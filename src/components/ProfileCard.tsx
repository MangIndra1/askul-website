'use client'

import { useState, useRef } from 'react'
import { updateProfile, updateAvatarPath } from '@/app/actions/profile'
import { createClient as createBrowserClient } from '@/utils/supabase/client'

function IconPencil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
    </svg>
  )
}
function IconCamera({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8a2 2 0 0 1 2-2h1l1.5-2h7L17 6h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}
function IconSchool({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 9 10-5 10 5-10 5-10-5Z" />
      <path d="M6 11v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" />
    </svg>
  )
}
function IconLink({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8" />
    </svg>
  )
}

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || '?'
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

export function ProfileCard({
  displayName,
  bio,
  institution,
  websiteUrl,
  avatarPath,
  avatarUrl,
  userId,
  stats,
}: {
  displayName: string
  bio: string | null
  institution: string | null
  websiteUrl: string | null
  avatarPath: string | null
  avatarUrl: string | null
  userId: string
  stats: { tasksCompleted: number; focusLabel: string; constellationsDone: string }
}) {
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(displayName)
  const [bioInput, setBioInput] = useState(bio ?? '')
  const [institutionInput, setInstitutionInput] = useState(institution ?? '')
  const [websiteInput, setWebsiteInput] = useState(websiteUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSave() {
    if (!nameInput.trim()) return
    setSaving(true)
    await updateProfile({
      displayName: nameInput.trim(),
      bio: bioInput.trim() || null,
      institution: institutionInput.trim() || null,
      websiteUrl: websiteInput.trim() || null,
    })
    setSaving(false)
    setEditing(false)
  }

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      window.alert('File harus berupa gambar.')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      window.alert('Ukuran foto maksimal 5MB.')
      return
    }

    setUploadingAvatar(true)
    const supabase = createBrowserClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${userId}/avatar-${Date.now()}.${ext}`

    const { error } = await supabase.storage.from('avatars').upload(path, file)
    if (!error) {
      await updateAvatarPath(path, avatarPath)
    }
    setUploadingAvatar(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="glass rounded-[28px] p-6">
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
        <div className="group relative shrink-0">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--lav-600)] to-[var(--pink-400)] text-3xl font-bold text-white">
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(displayName)}
          </div>
          <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100">
            <IconCamera className="h-5 w-5" />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} disabled={uploadingAvatar} />
          </label>
        </div>

        <div className="mt-4 min-w-0 flex-1 sm:ml-5 sm:mt-0">
          {editing ? (
            <div className="flex flex-col gap-2">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Nama"
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
              />
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                placeholder="Bio singkat..."
                rows={2}
                className="resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
              />
              <input
                value={institutionInput}
                onChange={(e) => setInstitutionInput(e.target.value)}
                placeholder="Institusi / program studi"
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
              />
              <input
                value={websiteInput}
                onChange={(e) => setWebsiteInput(e.target.value)}
                placeholder="Link (portofolio, LinkedIn, dll)"
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
              />
              <div className="mt-1 flex gap-2">
                <button onClick={handleSave} disabled={saving} className="rounded-xl bg-[var(--lav-600)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button onClick={() => setEditing(false)} className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm font-semibold text-[var(--dk-text-soft)]">
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <p className="text-lg font-bold text-[var(--dk-text)]">{displayName}</p>
                <button onClick={() => setEditing(true)} className="text-[var(--dk-text-faint)] transition hover:text-[var(--dk-text)]">
                  <IconPencil className="h-3.5 w-3.5" />
                </button>
              </div>
              {bio && <p className="mt-1 text-sm text-[var(--dk-text-soft)]">{bio}</p>}

              <div className="mt-2 flex flex-col items-center gap-1 sm:items-start">
                {institution && (
                  <span className="flex items-center gap-1.5 text-xs text-[var(--dk-text-faint)]">
                    <IconSchool className="h-3.5 w-3.5" /> {institution}
                  </span>
                )}
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[var(--lav-400)] hover:underline"
                  >
                    <IconLink className="h-3.5 w-3.5" /> {websiteUrl.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-6 border-t border-white/[0.08] pt-4 sm:justify-start">
        <div className="text-center sm:text-left">
          <p className="text-sm font-bold text-[var(--lav-400)]">{stats.tasksCompleted}</p>
          <p className="text-[10px] text-[var(--dk-text-faint)]">task selesai</p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-sm font-bold text-[var(--pink-400)]">{stats.focusLabel}</p>
          <p className="text-[10px] text-[var(--dk-text-faint)]">total fokus</p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-sm font-bold text-[var(--status-orange)]">{stats.constellationsDone}</p>
          <p className="text-[10px] text-[var(--dk-text-faint)]">rasi selesai</p>
        </div>
      </div>
    </div>
  )
}