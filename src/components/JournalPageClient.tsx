'use client'

import { useState } from 'react'
import { createJournalEntry, updateJournalEntry, deleteJournalEntry } from '@/app/actions/journal'

type JournalEntry = {
  id: string
  content: string
  mood: string | null
  created_at: string
}

const MOODS = [
  { value: 'senang', emoji: '😊', label: 'Senang' },
  { value: 'tenang', emoji: '😌', label: 'Tenang' },
  { value: 'biasa', emoji: '😐', label: 'Biasa' },
  { value: 'sedih', emoji: '😔', label: 'Sedih' },
  { value: 'kesal', emoji: '😤', label: 'Kesal' },
  { value: 'lelah', emoji: '😴', label: 'Lelah' },
]

function moodInfo(value: string | null) {
  return MOODS.find((m) => m.value === value) ?? null
}

function formatEntryDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatEntryTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

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

export function JournalPageClient({ entries }: { entries: JournalEntry[] }) {
  const [newContent, setNewContent] = useState('')
  const [newMood, setNewMood] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editMood, setEditMood] = useState<string | null>(null)

  async function handleCreate() {
    if (!newContent.trim()) return
    setSubmitting(true)
    await createJournalEntry(newContent.trim(), newMood)
    setNewContent('')
    setNewMood(null)
    setSubmitting(false)
  }

  function startEdit(entry: JournalEntry) {
    setEditingId(entry.id)
    setEditContent(entry.content)
    setEditMood(entry.mood)
  }

  async function saveEdit(id: string) {
    if (!editContent.trim()) return
    await updateJournalEntry(id, editContent.trim(), editMood)
    setEditingId(null)
  }

  async function handleDelete(entry: JournalEntry) {
    if (!window.confirm('Hapus catatan jurnal ini? Nggak bisa dibatalin.')) return
    await deleteJournalEntry(entry.id)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="glass rounded-[28px] p-6">
        <p className="text-[18px] font-bold tracking-[-0.3px] text-[var(--dk-text)]">Tulis Jurnal</p>

        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Lagi mikirin apa hari ini?"
          rows={5}
          className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[var(--dk-text)] outline-none placeholder:text-[var(--dk-text-faint)] focus:border-[var(--lav-400)]"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-[var(--dk-text-faint)]">Mood (opsional):</span>
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setNewMood(newMood === m.value ? null : m.value)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                newMood === m.value ? 'bg-[var(--lav-600)] text-white' : 'bg-white/[0.06] text-[var(--dk-text-soft)]'
              }`}
            >
              <span>{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleCreate}
          disabled={submitting || !newContent.trim()}
          className="mt-4 rounded-xl bg-[var(--lav-600)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? 'Menyimpan...' : 'Simpan Catatan'}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {entries.length === 0 ? (
          <div className="glass rounded-[28px] p-6 text-center text-sm text-[var(--dk-text-faint)]">
            Belum ada catatan jurnal. Mulai tulis yang pertama di atas.
          </div>
        ) : (
          entries.map((entry) => {
            const mood = moodInfo(entry.mood)
            const isEditing = editingId === entry.id

            return (
              <div key={entry.id} className="glass group rounded-[28px] p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--dk-text)]">{formatEntryDate(entry.created_at)}</p>
                    <p className="text-xs text-[var(--dk-text-faint)]">{formatEntryTime(entry.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {mood && !isEditing && (
                      <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-[var(--dk-text-soft)]">
                        {mood.emoji} {mood.label}
                      </span>
                    )}
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => startEdit(entry)}
                          className="text-[var(--dk-text-faint)] opacity-0 transition hover:text-[var(--dk-text)] group-hover:opacity-100"
                        >
                          <IconPencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry)}
                          className="text-[var(--dk-text-faint)] opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-3 flex flex-col gap-3">
                    <textarea
                      autoFocus
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={5}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {MOODS.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => setEditMood(editMood === m.value ? null : m.value)}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                            editMood === m.value ? 'bg-[var(--lav-600)] text-white' : 'bg-white/[0.06] text-[var(--dk-text-soft)]'
                          }`}
                        >
                          <span>{m.emoji}</span>
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(entry.id)}
                        className="rounded-xl bg-[var(--lav-600)] px-4 py-2 text-sm font-semibold text-white"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm font-semibold text-[var(--dk-text-soft)]"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--dk-text-soft)]">
                    {entry.content}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}