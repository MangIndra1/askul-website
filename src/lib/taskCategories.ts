export type TaskCategory = { id: string; name: string; color: string }

export function categoryColor(categories: TaskCategory[], categoryName: string | null): string {
  if (!categoryName) return 'var(--dk-text-faint)'
  return categories.find((c) => c.name === categoryName)?.color ?? 'var(--dk-text-faint)'
}