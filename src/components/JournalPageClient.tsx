'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createJournalEntry, updateJournalEntry, deleteJournalEntry } from '@/app/actions/journal'
import { createClient as createBrowserClient } from '@/utils/supabase/client'
import { MOODS, moodInfo } from '@/lib/moods'

type JournalEntry = {
  id: string
  content: string
  mood: string | null
  photo_path: string | null
  photo_url: string | null
  created_at: string
}

function toDateKey(d: Date) {
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatEntryDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function formatEntryTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}
function getGreeting(hour: number) {
  if (hour < 10) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

function IconPencil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
    </svg>
  )
}
function IconTrash({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
    </svg>
  )
}
function IconImage({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="9" cy="9" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  )
}
function IconX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}
function IconBook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  )
}

export function JournalPageClient({
  entries,
  displayName,
  userId,
}: {
  entries: JournalEntry[]
  displayName: string
  userId: string
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [newContent, setNewContent] = useState('')
  const [newMood, setNewMood] = useState<string | null>(null)
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null)
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const newPhotoInputRef = useRef<HTMLInputElement>(null)

  const [openId, setOpenId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editMood, setEditMood] = useState<string | null>(null)
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null)
  const [editRemovePhoto, setEditRemovePhoto] = useState(false)

  const todayKey = mounted ? toDateKey(new Date()) : null

  // Entry dari server terurut TERBARU dulu (DESC) — nomor halaman dihitung
  // dari urutan KRONOLOGIS (paling lama = Halaman 1), biar berasa buku yang
  // beneran nyambung. Kartu tetap ditampilin terbaru dulu biar gampang
  // nemuin entry baru tanpa scroll jauh.
  const totalEntries = entries.length
  function pageNumberFor(index: number) {
    return totalEntries - index
  }

  const last14Days = useMemo(() => {
    const days: Date[] = []
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      days.push(d)
    }
    return days
  }, [])

  const moodByDate = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const e of entries) {
      const key = toDateKey(new Date(e.created_at))
      if (!map.has(key)) map.set(key, e.mood)
    }
    return map
  }, [entries])

  const openEntry = entries.find((e) => e.id === openId) ?? null
  const openIndex = openEntry ? entries.findIndex((e) => e.id === openId) : -1

  function handleNewPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      window.alert('File harus berupa gambar.')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      window.alert('Ukuran foto maksimal 5MB.')
      return
    }
    setNewPhotoFile(file)
    setNewPhotoPreview(URL.createObjectURL(file))
  }

  function clearNewPhoto() {
    setNewPhotoFile(null)
    setNewPhotoPreview(null)
    if (newPhotoInputRef.current) newPhotoInputRef.current.value = ''
  }

  async function uploadPhoto(file: File): Promise<string | null> {
    const supabase = createBrowserClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('journal-photos').upload(path, file)
    if (error) {
      console.error('[uploadPhoto]', error.message)
      return null
    }
    return path
  }

  async function handleCreate() {
    if (!newContent.trim()) return
    setSubmitting(true)

    let photoPath: string | null = null
    if (newPhotoFile) {
      photoPath = await uploadPhoto(newPhotoFile)
    }

    await createJournalEntry(newContent.trim(), newMood, photoPath)
    setNewContent('')
    setNewMood(null)
    clearNewPhoto()
    setSubmitting(false)
  }

  function openPage(entry: JournalEntry) {
    setOpenId(entry.id)
    setIsEditing(false)
  }

  function closeModal() {
    setOpenId(null)
    setIsEditing(false)
  }

  function startEdit(entry: JournalEntry) {
    setIsEditing(true)
    setEditContent(entry.content)
    setEditMood(entry.mood)
    setEditPhotoFile(null)
    setEditPhotoPreview(null)
    setEditRemovePhoto(false)
  }

  function handleEditPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      window.alert('File harus berupa gambar.')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      window.alert('Ukuran foto maksimal 5MB.')
      return
    }
    setEditPhotoFile(file)
    setEditPhotoPreview(URL.createObjectURL(file))
    setEditRemovePhoto(false)
  }

  async function saveEdit(entry: JournalEntry) {
    if (!editContent.trim()) return

    let finalPhotoPath = entry.photo_path
    let removedPhotoPath: string | null = null

    if (editPhotoFile) {
      const newPath = await uploadPhoto(editPhotoFile)
      if (newPath) {
        removedPhotoPath = entry.photo_path
        finalPhotoPath = newPath
      }
    } else if (editRemovePhoto) {
      removedPhotoPath = entry.photo_path
      finalPhotoPath = null
    }

    await updateJournalEntry(entry.id, editContent.trim(), editMood, finalPhotoPath, removedPhotoPath)
    setIsEditing(false)
  }

  async function handleDelete(entry: JournalEntry) {
    if (!window.confirm('Hapus halaman jurnal ini? Nggak bisa dibatalin.')) return
    await deleteJournalEntry(entry.id)
    closeModal()
  }

  function renderMoodPicker(selected: string | null, onSelect: (v: string | null) => void) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {MOODS.map((m) => (
          <button
            key={m.value}
            onClick={() => onSelect(selected === m.value ? null : m.value)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition"
            style={
              selected === m.value
                ? { backgroundColor: m.color, color: '#fff' }
                : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--dk-text-soft)' }
            }
          >
            <span>{m.emoji}</span>
            {m.label}
          </button>
        ))}
      </div>
    )
  }

  const hour = new Date().getHours()

  return (
    <div className="flex flex-col gap-5">
      {/* Header: sapaan + tren mood + form tulis halaman baru */}
      <div className="glass rounded-[28px] p-6">
        <p suppressHydrationWarning className="text-[18px] font-bold tracking-[-0.3px] text-[var(--dk-text)]">
          {getGreeting(hour)}, {displayName}
        </p>
        <p className="mt-1 text-sm text-[var(--dk-text-faint)]">Lagi mikirin apa hari ini?</p>

        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1" suppressHydrationWarning>
          {last14Days.map((d) => {
            const key = toDateKey(d)
            const info = moodInfo(moodByDate.get(key) ?? null)
            return (
              <div
                key={key}
                title={`${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}${info ? ' — ' + info.label : ''}`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs"
                style={{ backgroundColor: info ? `${info.color}33` : 'rgba(255,255,255,0.04)' }}
              >
                {info?.emoji ?? ''}
              </div>
            )
          })}
        </div>

        <div className="mt-5 flex items-center gap-1.5 text-xs font-medium italic text-[var(--dk-text-faint)]">
          <IconBook className="h-3.5 w-3.5" />
          Halaman ke-{totalEntries + 1}
        </div>

        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Tulis apa aja yang lagi kamu rasain..."
          rows={5}
          className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[var(--dk-text)] outline-none placeholder:text-[var(--dk-text-faint)] focus:border-[var(--lav-400)]"
        />

        <div className="mt-3">{renderMoodPicker(newMood, setNewMood)}</div>

        <div className="mt-3">
          {newPhotoPreview ? (
            <div className="relative w-fit">
              <img src={newPhotoPreview} alt="" className="max-h-48 rounded-2xl object-cover" />
              <button onClick={clearNewPhoto} className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white">
                <IconX className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2 text-xs font-medium text-[var(--dk-text-soft)] transition hover:bg-white/[0.1]">
              <IconImage className="h-4 w-4" />
              Tambah foto (opsional)
              <input ref={newPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleNewPhotoSelect} />
            </label>
          )}
        </div>

        <button
          onClick={handleCreate}
          disabled={submitting || !newContent.trim()}
          className="mt-4 rounded-xl bg-[var(--lav-600)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? 'Menyimpan...' : 'Tulis Halaman Ini'}
        </button>
      </div>

      {/* Grid halaman-halaman jurnal */}
      {entries.length === 0 ? (
        <div className="glass rounded-[28px] p-6 text-center text-sm text-[var(--dk-text-faint)]">
          Buku jurnal kamu masih kosong. Mulai tulis halaman pertama di atas.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry, index) => {
            const mood = moodInfo(entry.mood)
            const accentColor = mood?.color ?? 'rgba(255,255,255,0.18)'
            const isToday = todayKey === toDateKey(new Date(entry.created_at))

            return (
              <button
                key={entry.id}
                onClick={() => openPage(entry)}
                className="glass group relative flex min-h-[220px] flex-col overflow-hidden rounded-[20px] p-5 text-left transition hover:-translate-y-1 hover:shadow-xl"
                style={{ borderLeft: `4px solid ${accentColor}` }}
              >
                {/* pojok halaman terlipat */}
                <div
                  className="pointer-events-none absolute right-0 top-0 h-7 w-7 transition group-hover:h-9 group-hover:w-9"
                  style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.1) 50%)' }}
                />

                <div className="flex items-center justify-between">
                  <span className="font-serif text-xs italic tracking-wide text-[var(--dk-text-faint)]">
                    Halaman {pageNumberFor(index)}
                  </span>
                  {isToday && (
                    <span className="rounded-full bg-[var(--lav-600)] px-2 py-0.5 text-[9px] font-semibold text-white">Hari ini</span>
                  )}
                </div>

                <p className="mt-1.5 text-xs text-[var(--dk-text-faint)]">{formatEntryDate(entry.created_at)}</p>

                {entry.photo_url && (
                  <img src={entry.photo_url} alt="" className="mt-3 h-24 w-full rounded-xl object-cover" />
                )}

                <div className="relative mt-3 flex-1">
                  <p className="line-clamp-4 text-sm leading-relaxed text-[var(--dk-text-soft)]">{entry.content}</p>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[rgba(15,21,40,0.65)] to-transparent" />
                </div>

                {mood && (
                  <span className="mt-3 flex w-fit items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-[var(--dk-text-soft)]">
                    {mood.emoji} {mood.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Modal "buka halaman" */}
      {openEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="glass relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[28px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closeModal} className="absolute right-5 top-5 text-[var(--dk-text-faint)] hover:text-[var(--dk-text)]">
              <IconX className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-medium italic text-[var(--dk-text-faint)]">
              <IconBook className="h-3.5 w-3.5" />
              Halaman {pageNumberFor(openIndex)}
            </div>
            <p className="mt-1 text-lg font-bold text-[var(--dk-text)]">{formatEntryDate(openEntry.created_at)}</p>
            <p className="text-xs text-[var(--dk-text-faint)]">{formatEntryTime(openEntry.created_at)}</p>

            {isEditing ? (
              <div className="mt-4 flex flex-col gap-3">
                <textarea
                  autoFocus
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
                />
                {renderMoodPicker(editMood, setEditMood)}

                {editPhotoPreview ? (
                  <div className="relative w-fit">
                    <img src={editPhotoPreview} alt="" className="max-h-56 rounded-2xl object-cover" />
                    <button onClick={() => { setEditPhotoFile(null); setEditPhotoPreview(null) }} className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white">
                      <IconX className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : openEntry.photo_url && !editRemovePhoto ? (
                  <div className="relative w-fit">
                    <img src={openEntry.photo_url} alt="" className="max-h-56 rounded-2xl object-cover" />
                    <button onClick={() => setEditRemovePhoto(true)} className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white">
                      <IconX className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2 text-xs font-medium text-[var(--dk-text-soft)] transition hover:bg-white/[0.1]">
                    <IconImage className="h-4 w-4" />
                    Tambah foto
                    <input type="file" accept="image/*" className="hidden" onChange={handleEditPhotoSelect} />
                  </label>
                )}

                <div className="flex gap-2">
                  <button onClick={() => saveEdit(openEntry)} className="rounded-xl bg-[var(--lav-600)] px-4 py-2 text-sm font-semibold text-white">
                    Simpan
                  </button>
                  <button onClick={() => setIsEditing(false)} className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm font-semibold text-[var(--dk-text-soft)]">
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <>
                {moodInfo(openEntry.mood) && (
                  <span className="mt-3 flex w-fit items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-[var(--dk-text-soft)]">
                    {moodInfo(openEntry.mood)!.emoji} {moodInfo(openEntry.mood)!.label}
                  </span>
                )}
                {openEntry.photo_url && (
                  <img src={openEntry.photo_url} alt="" className="mt-3 max-h-80 w-full rounded-2xl object-cover" />
                )}
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--dk-text-soft)]">{openEntry.content}</p>

                <div className="mt-5 flex gap-2 border-t border-white/[0.08] pt-4">
                  <button
                    onClick={() => startEdit(openEntry)}
                    className="flex items-center gap-1.5 rounded-xl bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-[var(--dk-text-soft)] transition hover:bg-white/[0.1]"
                  >
                    <IconPencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(openEntry)}
                    className="flex items-center gap-1.5 rounded-xl bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
                  >
                    <IconTrash className="h-3.5 w-3.5" /> Hapus
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}