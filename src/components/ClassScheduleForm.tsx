'use client'

import { useState } from 'react'
import {
  createClassScheduleRule,
  updateClassScheduleRule,
  deleteClassScheduleRule,
  setClassScheduleException,
  removeClassScheduleException,
} from '@/app/actions/classSchedule'
import { computeClassOccurrences, type ClassSchedule, type ClassScheduleException } from '@/lib/classSchedule'
import { DAY_OF_WEEK_LABELS } from '@/lib/recurrence'
import { categoryColor, type TaskCategory } from '@/lib/taskCategories'

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
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
function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
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

export function ClassScheduleForm({
  categories,
  schedules = [],
  exceptions = [],
}: {
  categories: TaskCategory[]
  schedules?: ClassSchedule[]
  exceptions?: ClassScheduleException[]
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [semesterStart, setSemesterStart] = useState('')
  const [semesterEnd, setSemesterEnd] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [reschedulingKey, setReschedulingKey] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleStart, setRescheduleStart] = useState('')
  const [rescheduleEnd, setRescheduleEnd] = useState('')

  const canSubmit = title.trim() && startTime && endTime && semesterStart && semesterEnd

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setCategory('')
    setDayOfWeek(1)
    setStartTime('')
    setEndTime('')
    setSemesterStart('')
    setSemesterEnd('')
    setFormOpen(false)
  }

  function startEdit(s: ClassSchedule) {
    setEditingId(s.id)
    setTitle(s.title)
    setCategory(s.category ?? '')
    setDayOfWeek(s.day_of_week)
    setStartTime(s.start_time)
    setEndTime(s.end_time)
    setSemesterStart(s.semester_start)
    setSemesterEnd(s.semester_end)
    setFormOpen(true)
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    const payload = {
      title: title.trim(),
      category: category || null,
      dayOfWeek,
      startTime,
      endTime,
      semesterStart,
      semesterEnd,
    }
    if (editingId) {
      await updateClassScheduleRule(editingId, payload)
    } else {
      await createClassScheduleRule(payload)
    }
    setSubmitting(false)
    resetForm()
  }

  async function handleDelete(s: ClassSchedule) {
    if (!window.confirm(`Hapus mata kuliah "${s.title}" beserta semua jadwalnya? Nggak bisa dibatalin.`)) return
    await deleteClassScheduleRule(s.id)
  }

  async function handleCancelOccurrence(scheduleId: string, originalDate: string) {
    await setClassScheduleException({
      scheduleId,
      originalDate,
      isCancelled: true,
      overrideDate: null,
      overrideStartTime: null,
      overrideEndTime: null,
    })
  }

  async function handleUndo(scheduleId: string, originalDate: string) {
    await removeClassScheduleException(scheduleId, originalDate)
  }

  function startReschedule(scheduleId: string, originalDate: string, currentDate: string, currentStart: string, currentEnd: string) {
    setReschedulingKey(`${scheduleId}_${originalDate}`)
    setRescheduleDate(currentDate)
    setRescheduleStart(currentStart)
    setRescheduleEnd(currentEnd)
  }

  async function handleSaveReschedule(scheduleId: string, originalDate: string) {
    if (!rescheduleDate || !rescheduleStart || !rescheduleEnd) return
    await setClassScheduleException({
      scheduleId,
      originalDate,
      isCancelled: false,
      overrideDate: rescheduleDate,
      overrideStartTime: rescheduleStart,
      overrideEndTime: rescheduleEnd,
    })
    setReschedulingKey(null)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eightWeeksLater = new Date(today)
  eightWeeksLater.setDate(eightWeeksLater.getDate() + 56)

  return (
    <div className="glass rounded-[28px] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[18px] font-bold tracking-[-0.3px] text-[var(--dk-text)]">Jadwal Kuliah</p>
          <p className="mt-0.5 text-xs text-[var(--dk-text-faint)]">
            Aturan mingguan per semester — bisa dibatalkan/dipindah per-pertemuan
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setFormOpen(true)
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--lav-600)] px-4 py-2 text-xs font-semibold text-white"
        >
          <IconPlus className="h-3.5 w-3.5" />
          Tambah Mata Kuliah
        </button>
      </div>

      {formOpen && (
        <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-white/[0.04] p-4">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nama mata kuliah..."
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none placeholder:text-[var(--dk-text-faint)] focus:border-[var(--lav-400)]"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
          >
            <option value="" className="bg-[#171c37]">Tanpa kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name} className="bg-[#171c37]">
                {c.name}
              </option>
            ))}
          </select>

          <div>
            <p className="mb-1.5 text-xs text-[var(--dk-text-faint)]">Hari</p>
            <div className="flex gap-1.5">
              {DAY_OF_WEEK_LABELS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => setDayOfWeek(i)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold transition ${
                    dayOfWeek === i ? 'bg-[var(--lav-600)] text-white' : 'bg-white/[0.06] text-[var(--dk-text-soft)]'
                  }`}
                >
                  {label.charAt(0)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
            />
            <span className="text-xs text-[var(--dk-text-faint)]">s/d</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs text-[var(--dk-text-faint)]">Rentang semester</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={semesterStart}
                onChange={(e) => setSemesterStart(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
              />
              <span className="text-xs text-[var(--dk-text-faint)]">s/d</span>
              <input
                type="date"
                value={semesterEnd}
                onChange={(e) => setSemesterEnd(e.target.value)}
                min={semesterStart}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--dk-text)] outline-none focus:border-[var(--lav-400)]"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || !canSubmit}
              className="flex-1 rounded-xl bg-[var(--lav-600)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Buat Jadwal'}
            </button>
            <button onClick={resetForm} className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm font-semibold text-[var(--dk-text-soft)]">
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {schedules.length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--dk-text-faint)]">Belum ada mata kuliah.</p>
        ) : (
          schedules.map((s) => {
            const color = categoryColor(categories, s.category)
            const isExpanded = expandedId === s.id
            const scheduleExceptions = exceptions.filter((e) => e.schedule_id === s.id)
            const occurrences = isExpanded
              ? computeClassOccurrences(s, scheduleExceptions, today, eightWeeksLater)
              : []

            return (
              <div key={s.id} className="rounded-xl bg-white/[0.03] p-3">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--dk-text)]">{s.title}</p>
                    <p className="text-xs text-[var(--dk-text-faint)]">
                      {DAY_OF_WEEK_LABELS[s.day_of_week]}, {s.start_time}–{s.end_time}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-[var(--dk-text-soft)] transition hover:bg-white/[0.1]"
                  >
                    <span className="flex items-center gap-1">
                      Kelola Pertemuan
                      <IconChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  <button onClick={() => startEdit(s)} className="shrink-0 text-[var(--dk-text-faint)] transition hover:text-[var(--dk-text)]">
                    <IconPencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(s)} className="shrink-0 text-[var(--dk-text-faint)] transition hover:text-red-400">
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 flex flex-col gap-1.5 border-t border-white/[0.06] pt-3">
                    <p className="text-[10px] text-[var(--dk-text-faint)]">8 minggu ke depan:</p>
                    {occurrences.length === 0 ? (
                      <p className="text-xs text-[var(--dk-text-faint)]">Nggak ada pertemuan dalam rentang ini.</p>
                    ) : (
                      occurrences.map((occ) => {
                        const key = `${occ.scheduleId}_${occ.originalDate}`
                        const isReschedulingThis = reschedulingKey === key
                        return (
                          <div key={key} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.02] px-2 py-1.5 text-xs">
                            {isReschedulingThis ? (
                              <div className="flex flex-1 flex-wrap items-center gap-1.5">
                                <input
                                  type="date"
                                  value={rescheduleDate}
                                  onChange={(e) => setRescheduleDate(e.target.value)}
                                  className="rounded-lg border border-white/10 bg-white/[0.04] px-1.5 py-1 text-[11px] text-[var(--dk-text)] outline-none"
                                />
                                <input
                                  type="time"
                                  value={rescheduleStart}
                                  onChange={(e) => setRescheduleStart(e.target.value)}
                                  className="rounded-lg border border-white/10 bg-white/[0.04] px-1.5 py-1 text-[11px] text-[var(--dk-text)] outline-none"
                                />
                                <input
                                  type="time"
                                  value={rescheduleEnd}
                                  onChange={(e) => setRescheduleEnd(e.target.value)}
                                  className="rounded-lg border border-white/10 bg-white/[0.04] px-1.5 py-1 text-[11px] text-[var(--dk-text)] outline-none"
                                />
                                <button
                                  onClick={() => handleSaveReschedule(occ.scheduleId, occ.originalDate)}
                                  className="rounded-lg bg-[var(--lav-600)] p-1 text-white"
                                >
                                  <IconCheck className="h-3 w-3" />
                                </button>
                                <button onClick={() => setReschedulingKey(null)} className="rounded-lg bg-white/[0.06] p-1 text-[var(--dk-text-soft)]">
                                  <IconX className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span
                                  className={
                                    occ.isCancelled
                                      ? 'text-[var(--dk-text-faint)] line-through'
                                      : 'text-[var(--dk-text-soft)]'
                                  }
                                >
                                  {formatDate(occ.date)}, {occ.startTime}–{occ.endTime}
                                  {occ.isCancelled && ' · Dibatalkan'}
                                  {occ.isRescheduled && ` · dipindah dari ${formatDate(occ.originalDate)}`}
                                </span>
                                <div className="flex shrink-0 gap-1">
                                  {occ.isCancelled || occ.isRescheduled ? (
                                    <button
                                      onClick={() => handleUndo(occ.scheduleId, occ.originalDate)}
                                      className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-[var(--dk-text-soft)] transition hover:bg-white/[0.1]"
                                    >
                                      Kembalikan
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() =>
                                          startReschedule(occ.scheduleId, occ.originalDate, occ.date, occ.startTime, occ.endTime)
                                        }
                                        className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-[var(--dk-text-soft)] transition hover:bg-white/[0.1]"
                                      >
                                        Pindah
                                      </button>
                                      <button
                                        onClick={() => handleCancelOccurrence(occ.scheduleId, occ.originalDate)}
                                        className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-red-400 transition hover:bg-red-400/10"
                                      >
                                        Batalkan
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}