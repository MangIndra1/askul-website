'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/calendar')
  revalidatePath('/tasks')
}

export async function createClassScheduleRule({
  title,
  category,
  dayOfWeek,
  startTime,
  endTime,
  semesterStart,
  semesterEnd,
}: {
  title: string
  category: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
  semesterStart: string
  semesterEnd: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  if (semesterStart > semesterEnd) {
    return { error: 'Tanggal mulai semester harus sebelum tanggal akhir' }
  }

  const { error } = await supabase.from('class_schedules').insert({
    user_id: user.id,
    title,
    category,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    semester_start: semesterStart,
    semester_end: semesterEnd,
  })

  if (error) {
    return { error: error.message }
  }

  revalidateAll()
  return { error: null }
}

export async function updateClassScheduleRule(
  id: string,
  {
    title,
    category,
    dayOfWeek,
    startTime,
    endTime,
    semesterStart,
    semesterEnd,
  }: {
    title: string
    category: string | null
    dayOfWeek: number
    startTime: string
    endTime: string
    semesterStart: string
    semesterEnd: string
  }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Belum login' }
  }

  const { error } = await supabase
    .from('class_schedules')
    .update({
      title,
      category,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      semester_start: semesterStart,
      semester_end: semesterEnd,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
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

  // class_schedule_exceptions ikut kehapus otomatis lewat "on delete cascade".
  const { error } = await supabase.from('class_schedules').delete().eq('id', id).eq('user_id', user.id)

  if (error) {
    return { error: error.message }
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

  const { error } = await supabase
    .from('class_schedule_exceptions')
    .delete()
    .eq('schedule_id', scheduleId)
    .eq('original_date', originalDate)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidateAll()
  return { error: null }
}