'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import {
  hasGoogleConnection,
  pushClassScheduleToGoogle,
  updateClassScheduleInGoogle,
  deleteClassScheduleFromGoogle,
  cancelGoogleEventInstance,
  rescheduleGoogleEventInstance,
  restoreGoogleEventInstance,
} from '@/lib/googleCalendar'

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/calendar')
  revalidatePath('/tasks')
}

type ScheduleInput = {
  title: string
  category: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
  semesterStart: string
  semesterEnd: string
}

export async function createClassScheduleRule(input: ScheduleInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  if (input.semesterStart > input.semesterEnd) {
    return { error: 'Tanggal mulai semester harus sebelum tanggal akhir' }
  }

  const { data: inserted, error } = await supabase
    .from('class_schedules')
    .insert({
      user_id: user.id,
      title: input.title,
      category: input.category,
      day_of_week: input.dayOfWeek,
      start_time: input.startTime,
      end_time: input.endTime,
      semester_start: input.semesterStart,
      semester_end: input.semesterEnd,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  const connected = await hasGoogleConnection(user.id)
  console.log('[createClassScheduleRule] Google connected?', connected)

  if (connected) {
    const eventId = await pushClassScheduleToGoogle(user.id, input)
    console.log('[createClassScheduleRule] eventId hasil push:', eventId)
    if (eventId) {
      const { error: linkError } = await supabase
        .from('class_schedules')
        .update({ google_event_id: eventId })
        .eq('id', inserted.id)
      if (linkError) console.error('[createClassScheduleRule] Gagal simpan google_event_id:', linkError.message)
    }
  }

  revalidateAll()
  return { error: null }
}

export async function updateClassScheduleRule(id: string, input: ScheduleInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { data: existing } = await supabase
    .from('class_schedules')
    .select('google_event_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('class_schedules')
    .update({
      title: input.title,
      category: input.category,
      day_of_week: input.dayOfWeek,
      start_time: input.startTime,
      end_time: input.endTime,
      semester_start: input.semesterStart,
      semester_end: input.semesterEnd,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  if (existing?.google_event_id) {
    await updateClassScheduleInGoogle(user.id, existing.google_event_id, input)
  } else if (await hasGoogleConnection(user.id)) {
    const eventId = await pushClassScheduleToGoogle(user.id, input)
    if (eventId) {
      await supabase.from('class_schedules').update({ google_event_id: eventId }).eq('id', id)
    }
  }

  revalidateAll()
  return { error: null }
}

export async function deleteClassScheduleRule(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { data: existing } = await supabase
    .from('class_schedules')
    .select('google_event_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  // class_schedule_exceptions ikut kehapus otomatis lewat "on delete cascade".
  const { error } = await supabase.from('class_schedules').delete().eq('id', id).eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  if (existing?.google_event_id) {
    await deleteClassScheduleFromGoogle(user.id, existing.google_event_id)
  }

  revalidateAll()
  return { error: null }
}

export async function setClassScheduleException({
  scheduleId,
  originalDate,
  isCancelled,
  overrideDate,
  overrideStartTime,
  overrideEndTime,
}: {
  scheduleId: string
  originalDate: string
  isCancelled: boolean
  overrideDate: string | null
  overrideStartTime: string | null
  overrideEndTime: string | null
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { data: schedule } = await supabase
    .from('class_schedules')
    .select('google_event_id')
    .eq('id', scheduleId)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase.from('class_schedule_exceptions').upsert(
    {
      schedule_id: scheduleId,
      user_id: user.id,
      original_date: originalDate,
      is_cancelled: isCancelled,
      override_date: overrideDate,
      override_start_time: overrideStartTime,
      override_end_time: overrideEndTime,
    },
    { onConflict: 'schedule_id,original_date' }
  )

  if (error) {
    return { error: error.message }
  }

  // Sync ke Google — best effort, nggak nge-block kalau gagal (area ini
  // masih belum pernah dites langsung, lihat catatan di googleCalendar.ts).
  if (schedule?.google_event_id) {
    if (isCancelled) {
      await cancelGoogleEventInstance(user.id, schedule.google_event_id, originalDate)
    } else if (overrideDate && overrideStartTime && overrideEndTime) {
      await rescheduleGoogleEventInstance(
        user.id,
        schedule.google_event_id,
        originalDate,
        overrideDate,
        overrideStartTime,
        overrideEndTime
      )
    }
  }

  revalidateAll()
  return { error: null }
}

export async function removeClassScheduleException(scheduleId: string, originalDate: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { data: schedule } = await supabase
    .from('class_schedules')
    .select('google_event_id, start_time, end_time')
    .eq('id', scheduleId)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('class_schedule_exceptions')
    .delete()
    .eq('schedule_id', scheduleId)
    .eq('original_date', originalDate)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  if (schedule?.google_event_id) {
    await restoreGoogleEventInstance(
      user.id,
      schedule.google_event_id,
      originalDate,
      schedule.start_time,
      schedule.end_time
    )
  }

  revalidateAll()
  return { error: null }
}