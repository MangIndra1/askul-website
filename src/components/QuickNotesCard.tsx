'use client'

import { useState } from 'react'
import { createQuickNote, deleteQuickNote } from '@/app/actions/quickNotes'

type Note = { id: string; content: string }

function IconPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
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

export function QuickNotesCard({ notes }: { notes: Note[] }) {
  const [adding, setAdding] = useState(false)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd() {
    if (!content.trim()) return
    setSubmitting(true)
    await createQuickNote(content.trim())
    setContent('')
    setAdding(false)
    setSubmitting(false)
  }

  return (
    <div className="glass flex flex-col rounded-[28px] p-6">
      <div className="flex items-center justify-between">
        <p className="text-[18px] font-bold tracking-[-0.3px] text-[var(--dk-text)]">Quick Notes</p>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[var(--dk-text-soft)] transition hover:bg-white/[0.1]"
        >
          <IconPlus className="h-4 w-4" />
        </button>
      </div>

      {adding && (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Catatan singkat..."
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none placeholder:text-[var(--dk-text-faint)] focus:border-[var(--lav-400)]"
          />
          <button
            onClick={handleAdd}
            disabled={submitting || !content.trim()}
            className="rounded-xl bg-[var(--lav-600)] px-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            OK
          </button>
        </div>
      )}

      <div className="mt-4 flex-1">
        {notes.length === 0 ? (
          <p className="text-sm text-[var(--dk-text-faint)]">Belum ada catatan.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {notes.map((note) => (
              <li key={note.id} className="group flex items-start gap-2 text-sm text-[var(--dk-text-soft)]">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--dk-text-faint)]" />
                <span className="flex-1">{note.content}</span>
                <button
                  onClick={() => deleteQuickNote(note.id)}
                  className="shrink-0 text-[var(--dk-text-faint)] opacity-0 transition hover:text-[var(--dk-text)] group-hover:opacity-100"
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 border-t border-white/[0.08] pt-4 text-center text-sm text-[var(--dk-text-soft)]">
        You’re doing great. Keep going! 💜
      </p>
    </div>
  )
}