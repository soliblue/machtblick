export function distinctSorted(values: string[], locale?: string): string[] {
  const unique = Array.from(new Set(values))
  return locale ? unique.sort((a, b) => a.localeCompare(b, locale)) : unique.sort()
}
