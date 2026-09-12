export const TASK_CATEGORIES = [
  { value: 'Kuliah', color: 'var(--lav-400)' },
  { value: 'Tugas', color: 'var(--pink-400)' },
  { value: 'Meeting', color: 'var(--status-blue)' },
  { value: 'Istirahat', color: 'var(--status-orange)' },
  { value: 'Pribadi', color: 'var(--status-green)' },
] as const

export function categoryColor(category: string | null): string {
  return TASK_CATEGORIES.find((c) => c.value === category)?.color ?? 'var(--dk-text-faint)'
}