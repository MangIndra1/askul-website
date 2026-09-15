export const MOODS = [
  { value: 'senang', emoji: '😊', label: 'Senang', color: '#59c878' },
  { value: 'tenang', emoji: '😌', label: 'Tenang', color: '#3172de' },
  { value: 'biasa', emoji: '😐', label: 'Biasa', color: '#9599c2' },
  { value: 'sedih', emoji: '😔', label: 'Sedih', color: '#8b4deb' },
  { value: 'kesal', emoji: '😤', label: 'Kesal', color: '#e99b41' },
  { value: 'lelah', emoji: '😴', label: 'Lelah', color: '#ec3c91' },
]

export function moodInfo(value: string | null) {
  return MOODS.find((m) => m.value === value) ?? null
}